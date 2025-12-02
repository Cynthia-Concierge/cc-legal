#!/bin/bash

# Array of ports to kill
PORTS=(3001 4000 5000 5001 5173 8080 9000)

echo "Killing processes on ports..."

for port in "${PORTS[@]}"; do
  if lsof -ti:$port > /dev/null 2>&1; then
    echo "  Killing process on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
  fi
done

echo "✅ All ports cleared!"

