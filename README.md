# Tyler Chat Interface

A modern web interface for interacting with Tyler, providing real-time chat capabilities, file handling, and a beautiful UI.

## Overview

Tyler Chat Interface is built with several core components that work together to create a seamless chat experience:

### Core Components

#### Frontend
A modern React application that provides:
- Real-time chat interface with WebSocket support
- File upload and attachment handling
- Message threading and context management
- Beautiful Material-UI based design
- Redux state management

#### Backend
A FastAPI server that manages:
- WebSocket connections for real-time updates
- File upload processing and storage
- Message threading and persistence
- Direct integration with Tyler agent
- PostgreSQL database for storage

### Key Features

- **Real-time Chat**: WebSocket-based communication for instant updates
- **File Handling**: Upload and process various file types
- **Message Threading**: Organize conversations with context
- **Modern UI**: Beautiful and responsive Material-UI design
- **State Management**: Robust Redux implementation
- **Database Storage**: PostgreSQL for persistent data
- **API Documentation**: Auto-generated OpenAPI docs

## Version Compatibility

Tyler Chat includes version information to help track compatibility with the Tyler agent package:

- The current Tyler Chat version is displayed in the UI at the bottom of the sidebar
- It shows both the Tyler Chat version and the compatible Tyler agent version
- The frontend is the single source of truth for version information

### Updating Version Information

To update the version compatibility information:

1. Edit `frontend/src/utils/version.ts` - this is the ONLY file you need to update
2. Update the `TYLER_CHAT_VERSION` constant when making significant changes to the chat interface itself
3. Update the `TYLER_COMPATIBLE_VERSION` constant to match the tested Tyler agent version

The version information is automatically propagated from the frontend to the backend via API calls, ensuring consistency across the application. This approach means you only need to update version information in one place.

## Setup and Installation

### Prerequisites

- Python 3.12.8
- Node.js and npm
- Docker and Docker Compose (for PostgreSQL)

### Backend Setup

1. **Clone the repository:**
```bash
git clone [your-repo-url]
cd tyler-chat
```

2. **Install backend dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**
```bash
cd backend
cp .env.example .env
```

Required environment variables:
```bash
# Server Configuration
HOST=localhost                        # Server host
PORT=8000                            # Server port
CORS_ORIGINS=http://localhost:5173   # Frontend URL for CORS

# Database Configuration
TYLER_DB_TYPE=postgresql             # Database type
TYLER_DB_HOST=localhost             # Database host
TYLER_DB_PORT=5432                  # Database port
TYLER_DB_NAME=tyler                 # Database name
TYLER_DB_USER=tyler                 # Database user
TYLER_DB_PASSWORD=tyler_dev         # Database password

# Optional Database Settings
TYLER_DB_ECHO=false                 # SQL query logging
TYLER_DB_POOL_SIZE=5                # Connection pool size
TYLER_DB_MAX_OVERFLOW=10            # Max extra connections
TYLER_DB_POOL_TIMEOUT=30            # Connection timeout (seconds)
TYLER_DB_POOL_RECYCLE=1800         # Connection recycle time (seconds)

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key  # Your OpenAI API key

# Logging Configuration
WANDB_API_KEY=your_wandb_api_key    # Weights & Biases API key for monitoring

# Optional Integrations
NOTION_TOKEN=your_notion_token      # Notion integration token
SLACK_BOT_TOKEN=your_slack_bot_token # Slack bot token
SLACK_SIGNING_SECRET=your_slack_signing_secret # Slack signing secret

# File Storage Configuration
TYLER_FILE_STORAGE_TYPE=local       # Storage type (local)
TYLER_FILE_STORAGE_PATH=/path/to/files  # Storage path (defaults to ~/.tyler/files)

# Other Settings
LOG_LEVEL=INFO                      # Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
```

4. **Start PostgreSQL with Docker:**
```bash
# From project root
docker-compose up -d

# Initialize the database (uses the same .env values)
python -m tyler.database.cli init
```

5. **Start the Backend Server:**
```bash
cd backend
./run.sh
```

The backend will be available at:
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Frontend Setup

1. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

2. **Start the Frontend Development Server:**
```bash
npm run dev
```

The frontend will be available at:
- http://localhost:5173

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Architecture

### Frontend Architecture

The frontend is built with:
- React 18+ with TypeScript
- Material-UI for components
- Redux Toolkit for state management
- WebSocket for real-time updates
- Vite for development and building

Key directories:
- `/src/components`: React components
- `/src/store`: Redux state management
- `/src/types`: TypeScript type definitions
- `/src/api`: API client code

### Backend Architecture

The backend uses:
- FastAPI for API endpoints
- WebSocket support for real-time
- SQLAlchemy for database ORM
- Pydantic for data validation
- Tyler Python package integration

Key directories:
- `/api`: API endpoint definitions
- `/models`: Database models
- `/services`: Business logic
- `/schemas`: Pydantic models

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

For commercial use, please contact the author. 