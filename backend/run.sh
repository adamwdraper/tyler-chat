#!/bin/bash

# Activate the virtual environment
source ~/.pyenv/versions/tyler/bin/activate

# Run the FastAPI server
uvicorn main:app --reload --port 8000 