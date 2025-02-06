#!/bin/bash

# Run the FastAPI server
uvicorn api_server:app --reload --port 8000 