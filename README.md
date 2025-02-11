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

## User Guide

### Prerequisites

- Python 3.12.8
- Node.js and npm
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. **Clone the repository and set up environment:**
```bash
git clone [your-repo-url]
cd tyler-chat

# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Configure environment variables:**

Create a `.env` file in the backend directory:
```bash
cd backend
cp .env.example .env
```

Required environment variables:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Database Configuration (for Docker setup)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tyler
DB_USER=tyler_user
DB_PASSWORD=your_password

# Optional Integrations
NOTION_TOKEN=your-notion-token
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
```

3. **Start PostgreSQL with Docker:**
```bash
# From project root
docker-compose up -d
```

### Running the Application

1. **Start the Backend Server:**
```bash
cd backend
./run.sh
```

2. **Start the Frontend Development Server:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Development Setup

For development work:

1. **Backend Development:**
```bash
cd backend
pip install -e ".[dev]"
```

2. **Frontend Development:**
```bash
cd frontend
npm install

# Run with hot reloading
npm run dev
```

3. **Database Management:**
```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs postgres
```

### Testing

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