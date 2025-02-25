from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional, Dict, Any, Set, Union, Literal
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime, UTC
from dotenv import load_dotenv
import weave
import asyncpg
import json
import asyncio
import base64
import logging
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from contextlib import asynccontextmanager
import importlib.metadata

from tyler.models.thread import Thread
from tyler.models.message import Message, Attachment
from tyler.models.agent import Agent
from tyler.database.thread_store import ThreadStore
from tyler.storage import FileStore

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Define the expected Tyler version
EXPECTED_TYLER_VERSION = "0.3.1"  # Update this when testing with new Tyler versions

# Check Tyler version
try:
    installed_tyler_version = importlib.metadata.version("tyler-agent")
    if installed_tyler_version != EXPECTED_TYLER_VERSION:
        logger.warning(f"Warning: Installed Tyler version ({installed_tyler_version}) does not match expected version ({EXPECTED_TYLER_VERSION})")
except Exception as e:
    logger.warning(f"Failed to check Tyler version: {e}")

# Initialize weave for tracing (optional - requires WANDB_API_KEY environment variable)
try:
    if os.getenv("WANDB_API_KEY"):
        weave.init("tyler")
        logger.info("Weave tracing initialized successfully")
except Exception as e:
    logger.warning(f"Failed to initialize weave tracing: {e}. Continuing without weave.")

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
    attachments: Optional[List[Dict[str, Any]]] = None

class ThreadCreate(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    source: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None

class ThreadUpdate(BaseModel):
    title: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None

class VersionInfo(BaseModel):
    tyler_chat_version: str  # Will be provided by the frontend
    expected_tyler_version: str  # Will be provided by the frontend or use EXPECTED_TYLER_VERSION
    installed_tyler_version: Optional[str] = None
    is_compatible: bool = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database and file store initialization."""
    logger.info("Initializing thread store...")
    await thread_store.initialize()
    
    # Create file storage directory if it doesn't exist
    storage_path = os.getenv("TYLER_FILE_STORAGE_PATH", os.path.join(os.path.dirname(__file__), "files"))
    if storage_path.startswith("/"):  # Convert absolute path to relative
        storage_path = os.path.join(os.path.dirname(__file__), storage_path.lstrip("/"))
    os.makedirs(storage_path, exist_ok=True)
    logger.info(f"Ensured file storage directory exists at: {storage_path}")
    
    # Set environment variable for FileStore to use
    os.environ["TYLER_FILE_STORAGE_PATH"] = storage_path
    
    # Mount the files directory after creating it
    app.mount("/files", StaticFiles(directory=storage_path), name="files")
    logger.info(f"Mounted static files directory at: {storage_path}")
    
    # Verify file store is accessible
    logger.info("Checking file store health...")
    file_store = FileStore()
    logger.info(f"Initialized file store at: {file_store.base_path}")
    health = await file_store.check_health()
    if not health['healthy']:
        logger.error(f"File store health check failed: {health['errors']}")
        raise RuntimeError("File store initialization failed")
    logger.info(f"File store health check passed. Storage size: {health['total_size']} bytes, Files: {health['file_count']}")
    yield

# Initialize FastAPI app
app = FastAPI(
    title="Tyler API", 
    description="REST API for Tyler thread management",
    lifespan=lifespan
)

# Add CORS middleware
frontend_port = os.getenv("FRONTEND_PORT", "3000")
cors_origins = [f"http://localhost:{frontend_port}"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600  # Cache preflight requests for 10 minutes
)

# Initialize thread store and agent
# Construct PostgreSQL URL from environment variables
db_url = f"postgresql+asyncpg://{os.getenv('TYLER_DB_USER')}:{os.getenv('TYLER_DB_PASSWORD')}@{os.getenv('TYLER_DB_HOST')}:{os.getenv('TYLER_DB_PORT')}/{os.getenv('TYLER_DB_NAME')}"

# Initialize ThreadStore with PostgreSQL URL
thread_store = ThreadStore(db_url)

# Initialize file store
file_store = FileStore()
logger.info(f"Initialized file store at: {file_store.base_path}")

agent = Agent(
    model_name="gpt-4o",
    purpose="To help with general questions",
    tools=[
        "web",
        "slack",
        "notion",
        "command_line",
        "image"
    ],
    thread_store=thread_store
)

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

@app.post("/threads/{thread_id}/messages")
async def add_message(
    thread_id: str,
    message: str = Form(...),
    files: List[UploadFile] = None,
    process: bool = Form(True),  # Add process parameter with default True
    thread_store: ThreadStore = Depends(get_thread_store),
    background_tasks: BackgroundTasks = None
):
    """Add a message to a thread and optionally process it"""
    thread = await thread_store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Parse message data from form
    message_data = json.loads(message)
    
    # Process uploaded files if any
    attachments = []
    if files:
        for file in files:
            content = await file.read()
            attachment = Attachment(
                filename=file.filename,
                content=content,
                mime_type=file.content_type
            )
            attachments.append(attachment)
    
    # Create new message
    new_message = Message(
        role=message_data["role"],
        content=message_data["content"],
        name=message_data.get("name"),
        tool_call_id=message_data.get("tool_call_id"),
        tool_calls=message_data.get("tool_calls"),
        attributes=message_data.get("attributes", {}),
        source=message_data.get("source"),
        attachments=attachments
    )
    thread.add_message(new_message)
    
    # Save thread
    await thread_store.save(thread)
    
    # Process thread if requested
    if process:
        print(f"\nProcessing thread {thread_id}")
        thread, new_messages = await agent.go(thread.id)
        
        # Check if this is a new chat and we should generate a title
        if thread.title == "New Chat" and not thread.attributes.get("title_generated"):
            if any(m.role == "assistant" for m in thread.messages):
                if background_tasks:
                    background_tasks.add_task(generate_and_save_title, thread_id, thread_store, manager)
    
    # Convert thread to dict and return as JSON response
    return JSONResponse(content=thread.to_dict())

@app.websocket("/ws/threads/{thread_id}")
async def websocket_endpoint(websocket: WebSocket, thread_id: str):
    await manager.connect(websocket, thread_id)
    try:
        while True:
            # Keep the connection alive with periodic pings
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        manager.disconnect(websocket, thread_id)

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
    
    print(f"\nProcessing thread {thread_id}")
    processed_thread, new_messages = await agent.go(thread.id)
    
    # Check if this is a new chat (title is default) and we haven't generated a title yet
    if processed_thread.title == "New Chat" and not processed_thread.attributes.get("title_generated"):
        # Only generate title if we have at least one assistant message
        if any(m.role == "assistant" for m in processed_thread.messages):
            background_tasks.add_task(generate_and_save_title, thread_id, thread_store, manager)
    
    return processed_thread

async def generate_and_save_title(thread_id: str, thread_store: ThreadStore, manager: ConnectionManager):
    """Background task to generate and save title"""
    print(f"\nBackground task starting for thread {thread_id}")
    thread = await thread_store.get(thread_id)
    if thread and not thread.attributes.get("title_generated"):
        # Generate new title
        new_title = thread.generate_title()
        
        # Update title and set the flag
        thread.attributes["title_generated"] = True
        updated_thread = await update_thread(
            thread_id=thread_id,
            thread_data=ThreadUpdate(
                title=new_title,
                attributes=thread.attributes
            ),
            thread_store=thread_store
        )
        
        # Broadcast the update
        await manager.broadcast_title_update(thread_id, updated_thread)
        print("Title saved and broadcasted")

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

@app.get("/version", response_model=VersionInfo)
async def get_version_info(
    frontend_version: Optional[str] = None,
    compatible_version: Optional[str] = None
):
    """
    Get version information about the Tyler Chat and Tyler agent.
    
    The frontend version and compatible version can be provided as query parameters.
    If provided, these values will be used instead of the hardcoded values.
    This makes the frontend the single source of truth for version information.
    """
    try:
        installed_version = importlib.metadata.version("tyler-agent")
        # Use the compatible_version from the frontend if provided
        expected_version = compatible_version or EXPECTED_TYLER_VERSION
        is_compatible = installed_version == expected_version
    except Exception:
        installed_version = None
        is_compatible = False
    
    return VersionInfo(
        # Use the frontend_version if provided, otherwise use the hardcoded value
        tyler_chat_version=frontend_version or "0.3.1",
        # Use the compatible_version if provided, otherwise use the hardcoded value
        expected_tyler_version=compatible_version or EXPECTED_TYLER_VERSION,
        installed_tyler_version=installed_version,
        is_compatible=is_compatible
    )

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 