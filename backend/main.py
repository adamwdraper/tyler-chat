from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncio
import weave
import os
from dotenv import load_dotenv
from tyler.models.agent import Agent
from tyler.models.thread import Thread, Message
from tyler.database.thread_store import ThreadStore

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables first
load_dotenv()

# Initialize weave for tracing (optional - requires WANDB_API_KEY environment variable)
if os.getenv("WANDB_API_KEY"):
    weave.init("company-of-agents/tyler-chat")


# Initialize Tyler agent
database_url = (
    f"postgresql+asyncpg://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT', '5432')}"
    f"/{os.getenv('DB_NAME')}"
)
store = ThreadStore(database_url)

# Initialize agent with configured store
agent = Agent(
    thread_store=store,
    purpose="To help with general questions and tasks",
    tools=[
        "web"
    ]
)

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

# Pydantic models for request/response
class MessageCreate(BaseModel):
    content: str
    thread_id: Optional[str] = None
    type: str = "text"

class MessageResponse(BaseModel):
    id: str
    content: str
    type: str
    senderId: str
    timestamp: str

class ThreadResponse(BaseModel):
    id: str
    name: str
    avatar: str
    status: str
    messages: List[MessageResponse]
    lastActivity: Optional[str]

@app.get("/api/threads")
async def get_threads():
    threads = await store.list()
    return [
        {
            "id": thread.id,
            "name": "Tyler",  # For now, all threads are with Tyler
            "avatar": "/avatars/tyler.jpg",  # Default avatar
            "status": "online",
            "messages": [
                {
                    "id": msg.id,
                    "content": msg.content,
                    "type": "text",
                    "senderId": msg.role,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat()
                }
                for msg in thread.messages
            ],
            "lastActivity": thread.messages[-1].timestamp.isoformat() if thread.messages else None
        }
        for thread in threads
    ]

@app.get("/api/threads/{thread_id}")
async def get_thread(thread_id: str):
    thread = await store.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    return {
        "id": thread.id,
        "name": "Tyler",  # For now, all threads are with Tyler
        "avatar": "/avatars/tyler.jpg",  # Default avatar
        "status": "online",
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "type": "text",
                "senderId": msg.role,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat()
            }
            for msg in thread.messages
        ],
        "lastActivity": thread.messages[-1].timestamp.isoformat() if thread.messages else None
    }

@app.post("/api/messages")
async def create_message(message: MessageCreate):
    # Create or get thread
    thread = None
    if message.thread_id:
        thread = await store.get(message.thread_id)
    if not thread:
        thread = Thread()
        await store.save(thread)

    # Create message
    new_message = Message(
        role="user",
        content=message.content,
        type=message.type
    )
    thread.add_message(new_message)

    # Process with Tyler
    processed_thread, new_messages = await agent.go(thread)

    # Broadcast new messages through WebSocket
    for msg in new_messages:
        await manager.broadcast({
            "type": "new_message",
            "threadId": thread.id,
            "message": {
                "id": msg.id,
                "content": msg.content,
                "type": "text",
                "senderId": msg.role,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat()
            }
        })

    return {
        "threadId": thread.id,
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "type": "text",
                "senderId": msg.role,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat()
            }
            for msg in new_messages
        ]
    }

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), thread_id: Optional[str] = None):
    content = await file.read()
    
    # Create or get thread
    thread = None
    if thread_id:
        thread = await store.get(thread_id)
    if not thread:
        thread = Thread()
        await store.save(thread)

    # Create message with attachment
    new_message = Message(
        role="user",
        content=f"I've uploaded a file: {file.filename}",
        filename=file.filename,
        file_content=content
    )
    thread.add_message(new_message)

    # Process with Tyler
    processed_thread, new_messages = await agent.go(thread)

    # Broadcast new messages
    for msg in new_messages:
        await manager.broadcast({
            "type": "new_message",
            "threadId": thread.id,
            "message": {
                "id": msg.id,
                "content": msg.content,
                "type": "text",
                "senderId": msg.role,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat()
            }
        })

    return {
        "threadId": thread.id,
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "type": "text",
                "senderId": msg.role,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat()
            }
            for msg in new_messages
        ]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle any client-side events if needed
            await asyncio.sleep(0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def setup_agent():
    # Configure storage with connection URL
    db_url = (
        f"postgresql+asyncpg://{os.getenv('TYLER_DB_USER')}:{os.getenv('TYLER_DB_PASSWORD')}"
        f"@{os.getenv('TYLER_DB_HOST')}:{os.getenv('TYLER_DB_PORT')}/{os.getenv('TYLER_DB_NAME')}"
    )
    store = ThreadStore(db_url)

    # Create agent with persistent storage
    agent = Agent(
        purpose="To help with general questions and tasks",
        thread_store=store
    )
    
    return agent

def create_thread(agent, message_content):
    # This should be async since it uses async operations
    async def _create_thread():
        thread = Thread()
        message = Message(role="user", content=message_content)
        thread.add_message(message)
        
        processed_thread, new_messages = await agent.go(thread)
        return processed_thread, new_messages
    
    return _create_thread()

@app.delete("/api/threads/{thread_id}")
async def delete_thread(thread_id: str):
    # Delete the thread (which includes all its messages)
    success = await store.delete(thread_id)
    if success:
        return {"status": "success", "message": "Thread deleted"}
    else:
        raise HTTPException(status_code=404, detail="Thread not found")

if __name__ == "__main__":
    # Test the setup
    async def main():
        agent = setup_agent()
        thread, messages = await create_thread(agent, "Hello! What can you help me with?")
        
        for message in messages:
            if message.role == "assistant":
                print(message.content)
    
    # Run the async main function
    asyncio.run(main()) 