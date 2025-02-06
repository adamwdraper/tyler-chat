from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime
from dotenv import load_dotenv
import weave
import asyncpg

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

@app.post("/threads", response_model=Thread)
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
        content=message.content
    )
    thread.add_message(new_message)
    
    await thread_store.save(thread)
    return thread

@app.post("/threads/{thread_id}/process", response_model=Thread)
async def process_thread(
    thread_id: str,
    thread_store: ThreadStore = Depends(get_thread_store)
):
    """Process a thread with the agent"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    processed_thread, new_messages = await agent.go(thread.id)
    await thread_store.save(processed_thread)
    return processed_thread

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