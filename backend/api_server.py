from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime
from dotenv import load_dotenv
import weave
import asyncio

from tyler.models.thread import Thread
from tyler.models.message import Message
from tyler.models.agent import Agent
from tyler.database.thread_store import ThreadStore

# Load environment variables from .env file
load_dotenv()

# Initialize weave for tracing (optional - requires WANDB_API_KEY environment variable)
if os.getenv("WANDB_API_KEY"):
    weave.init("tyler")

# Pydantic models for request/response
class MessageCreate(BaseModel):
    role: str
    content: str

class ThreadCreate(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None

class ThreadUpdate(BaseModel):
    title: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None

# Initialize FastAPI app
app = FastAPI(title="Tyler API", description="REST API for Tyler thread management")

# Add API router prefix
api_router = FastAPI(title="Tyler API Routes")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
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
    thread_store=thread_store
)

# Dependency to get thread store
async def get_thread_store():
    return thread_store

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# Move all routes under /api prefix
app.mount("/api", api_router)

@api_router.post("/threads", response_model=Thread)
async def create_thread(
    thread_data: ThreadCreate,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Create a new thread"""
    thread = Thread(
        title=thread_data.title,
        attributes=thread_data.attributes or {}
    )
    
    if thread_data.system_prompt:
        thread.ensure_system_prompt(thread_data.system_prompt)
    
    await thread_store.save(thread)
    return thread

@api_router.get("/threads", response_model=List[Thread])
async def list_threads(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """List threads with pagination"""
    return await thread_store.list(limit=limit, offset=offset)

@api_router.get("/threads/{thread_id}", response_model=Thread)
async def get_thread(
    thread_id: str,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Get a specific thread by ID"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread

@api_router.patch("/threads/{thread_id}", response_model=Thread)
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

@api_router.delete("/threads/{thread_id}")
async def delete_thread(
    thread_id: str,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Delete a thread"""
    success = await thread_store.delete(thread_id)
    if not success:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"status": "success"}

@api_router.post("/threads/{thread_id}/messages", response_model=Thread)
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
        content=message.content
    )
    thread.add_message(new_message)
    
    # Broadcast the new message through WebSocket
    await manager.broadcast({
        "type": "new_message",
        "threadId": thread_id,
        "message": {
            "id": new_message.id,
            "content": new_message.content,
            "type": "text",
            "senderId": new_message.role,
            "timestamp": new_message.timestamp.isoformat() if new_message.timestamp else datetime.now().isoformat()
        }
    })
    
    await thread_store.save(thread)
    return thread

@api_router.post("/threads/{thread_id}/process", response_model=Thread)
async def process_thread(
    thread_id: str,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Process a thread with the agent"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    processed_thread, new_messages = await agent.go(thread)
    
    # Broadcast any new messages through WebSocket
    for msg in new_messages:
        await manager.broadcast({
            "type": "new_message",
            "threadId": thread_id,
            "message": {
                "id": msg.id,
                "content": msg.content,
                "type": "text",
                "senderId": msg.role,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat()
            }
        })
    
    await thread_store.save(processed_thread)
    return processed_thread

@api_router.get("/threads/search/attributes")
async def search_threads_by_attributes(
    attributes: Dict[str, Any],
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Search threads by attributes"""
    return await thread_store.find_by_attributes(attributes)

@api_router.get("/threads/search/source")
async def search_threads_by_source(
    source_name: str,
    properties: Dict[str, Any],
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Search threads by source name and properties"""
    return await thread_store.find_by_source(source_name, properties)

# Keep WebSocket endpoint at root level since it's not a REST endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We're only using WebSocket for server->client communication
            # So we can just keep the connection alive without processing incoming messages
            try:
                await websocket.receive_text()
            except Exception:
                pass
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 