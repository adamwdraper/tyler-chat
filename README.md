# Tyler Chat Interface

This is the chat interface for interacting with Tyler. It consists of:

1. A React frontend for the chat UI
2. A FastAPI backend that handles:
   - WebSocket connections for real-time updates
   - File uploads
   - Message threading
   - Communication with Tyler agent

## Setup

### Prerequisites
- Python 3.12.8
- Docker and Docker Compose
- Node.js and npm

### Backend

1. **Set up Python environment**
```bash
# The virtual environment will be named 'tyler-chat' based on .python-version
pyenv local 3.12.8
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. **Configure environment**
```bash
cd backend
# Create environment file from example
cp .env.example .env
```

After copying the .env file, you'll need to configure these essential variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- Database settings (defaults are configured for local Docker setup)
- Other optional integrations as needed (Notion, Slack, etc.)

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up PostgreSQL with Docker**
```bash
# Start the PostgreSQL database
docker-compose up -d
```

This will create a PostgreSQL instance with:
- Database name: tyler
- User: tyler_user
- Password: your_password (change this in both .env and docker-compose.yml)
- Port: 5432

### Frontend
```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend Server
```bash
cd backend
./run.sh
```

### Start the Frontend Development Server
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Architecture

The chat interface is designed to be a separate application that communicates with Tyler through its Python package interface. This separation allows Tyler to focus on being an agent while the chat interface handles all the UI and real-time communication concerns.

### Frontend
- React with TypeScript
- Material-UI for components
- Redux for state management
- WebSocket for real-time updates

### Backend
- FastAPI for the API server
- WebSocket support for real-time communication
- File upload handling
- Integration with Tyler agent through the Python package
- PostgreSQL database for persistent storage 