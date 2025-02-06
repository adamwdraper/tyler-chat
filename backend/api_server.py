from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any, Set, Union, Literal
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime
from dotenv import load_dotenv
import weave
import asyncpg
import json
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from tyler.models.thread import Thread
from tyler.models.message import Message, Attachment
from tyler.models.agent import Agent
from tyler.database.thread_store import ThreadStore, ThreadRecord

# Load environment variables from .env file
load_dotenv()

# Initialize weave for tracing (optional - requires WANDB_API_KEY environment variable)
if os.getenv("WANDB_API_KEY"):
    weave.init("tyler")

# Pydantic models for request/response
class ImageUrl(BaseModel):
    url: str

class ImageContent(BaseModel):
    type: Literal["image_url"]
    image_url: ImageUrl

class TextContent(BaseModel):
    type: Literal["text"]
    text: str

class MessageCreate(BaseModel):
    role: str
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None
    tool_calls: Optional[list] = None
    attributes: Optional[Dict[str, Any]] = None
    source: Optional[Dict[str, Any]] = None

class ThreadCreate(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    source: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None

class ThreadUpdate(BaseModel):
    title: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None

# Initialize FastAPI app
app = FastAPI(title="Tyler API", description="REST API for Tyler thread management")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend development server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize thread store and agent
# Construct PostgreSQL URL from environment variables
db_url = f"postgresql+asyncpg://{os.getenv('TYLER_DB_USER')}:{os.getenv('TYLER_DB_PASSWORD')}@{os.getenv('TYLER_DB_HOST')}:{os.getenv('TYLER_DB_PORT')}/{os.getenv('TYLER_DB_NAME')}"

# Initialize ThreadStore with PostgreSQL URL
thread_store = ThreadStore(db_url)

agent = Agent(
    model_name="gpt-4o",
    purpose="To help with general questions",
    tools=[
        "web"
    ],
    thread_store=thread_store
)

@app.on_event("startup")
async def startup_event():
    """Initialize the database on startup."""
    await thread_store.initialize()

# Dependency to get thread store
async def get_thread_store():
    return thread_store

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, thread_id: str):
        await websocket.accept()
        if thread_id not in self.active_connections:
            self.active_connections[thread_id] = set()
        self.active_connections[thread_id].add(websocket)

    def disconnect(self, websocket: WebSocket, thread_id: str):
        if thread_id in self.active_connections:
            self.active_connections[thread_id].discard(websocket)
            if not self.active_connections[thread_id]:
                del self.active_connections[thread_id]

    async def broadcast_title_update(self, thread_id: str, thread: Thread):
        if thread_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[thread_id]:
                try:
                    await connection.send_json({
                        "type": "title_update",
                        "thread_id": thread_id,
                        "thread": thread.to_dict()
                    })
                except WebSocketDisconnect:
                    dead_connections.add(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                self.disconnect(dead, thread_id)

manager = ConnectionManager()

@app.post("/threads", response_model=Thread)
async def create_thread(
    thread_data: ThreadCreate,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Create a new thread"""
    thread = Thread(
        title=thread_data.title,
        attributes=thread_data.attributes or {},
        source=thread_data.source,
        metrics=thread_data.metrics or {
            "completion_tokens": 0,
            "prompt_tokens": 0,
            "total_tokens": 0,
            "model_usage": {}
        }
    )
    
    if thread_data.system_prompt:
        thread.ensure_system_prompt(thread_data.system_prompt)
    
    await thread_store.save(thread)
    return thread

@app.get("/threads", response_model=List[Thread])
async def list_threads(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """List threads with pagination"""
    return await thread_store.list(limit=limit, offset=offset)

@app.get("/threads/{thread_id}", response_model=Thread)
async def get_thread(
    thread_id: str,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Get a specific thread by ID"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread

@app.patch("/threads/{thread_id}", response_model=Thread)
async def update_thread(
    thread_id: str,
    thread_data: ThreadUpdate,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Update thread title or attributes"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread_data.title is not None:
        thread.title = thread_data.title
    if thread_data.attributes is not None:
        thread.attributes.update(thread_data.attributes)
    
    await thread_store.save(thread)
    return thread

@app.delete("/threads/{thread_id}")
async def delete_thread(
    thread_id: str,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Delete a thread"""
    success = await thread_store.delete(thread_id)
    if not success:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"status": "success"}

@app.post("/threads/{thread_id}/messages", response_model=Thread)
async def add_message(
    thread_id: str,
    message: MessageCreate,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Add a message to a thread"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    new_message = Message(
        role=message.role,
        content=message.content,
        name=message.name,
        tool_call_id=message.tool_call_id,
        tool_calls=message.tool_calls,
        attributes=message.attributes or {},
        source=message.source
    )
    thread.add_message(new_message)
    
    await thread_store.save(thread)
    return thread

@app.websocket("/ws/threads/{thread_id}")
async def websocket_endpoint(websocket: WebSocket, thread_id: str):
    await manager.connect(websocket, thread_id)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, thread_id)

async def generate_and_save_title(thread_id: str, thread_store: ThreadStore, manager: ConnectionManager):
    """Background task to generate and save title"""
    print(f"\nBackground task starting for thread {thread_id}")
    thread = await thread_store.get(thread_id)
    if thread:
        thread.generate_title()
        await manager.broadcast_title_update(thread.id, thread)
        await thread_store.save(thread)
        print("Title saved and broadcasted")

@app.post("/threads/{thread_id}/process", response_model=Thread)
async def process_thread(
    thread_id: str,
    background_tasks: BackgroundTasks,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Process a thread with the agent"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Count assistant messages before processing
    assistant_messages_before = len([m for m in thread.messages if m.role == "assistant"])
    print(f"\nProcessing thread {thread_id}")
    
    processed_thread, new_messages = await agent.go(thread.id)
    
    # Update the original thread with the processed messages
    thread.messages = processed_thread.messages
    
    # Save thread with new messages first
    await thread_store.save(thread)
    
    # Count assistant messages after processing
    assistant_messages_after = len([m for m in thread.messages if m.role == "assistant"])
    
    # Schedule title generation in background if this is the first assistant message
    if assistant_messages_before == 0 and assistant_messages_after > 0:
        background_tasks.add_task(generate_and_save_title, thread_id, thread_store, manager)
    
    return thread

@app.get("/threads/search/attributes")
async def search_threads_by_attributes(
    attributes: Dict[str, Any],
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Search threads by attributes"""
    return await thread_store.find_by_attributes(attributes)

@app.get("/threads/search/source")
async def search_threads_by_source(
    source_name: str,
    properties: Dict[str, Any],
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Search threads by source name and properties"""
    return await thread_store.find_by_source(source_name, properties)

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 