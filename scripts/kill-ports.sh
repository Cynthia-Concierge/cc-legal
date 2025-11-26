#!/bin/bash

# Kill processes on port 8080 (frontend)
if lsof -ti:8080 > /dev/null 2>&1; then
  echo "Killing process on port 8080..."
  lsof -ti:8080 | xargs kill -9 2>/dev/null || true
fi

# Kill processes on port 3001 (backend)
if lsof -ti:3001 > /dev/null 2>&1; then
  echo "Killing process on port 3001..."
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

echo "Ports cleared!"

