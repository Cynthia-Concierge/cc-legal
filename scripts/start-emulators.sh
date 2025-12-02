#!/bin/bash

# Start Firebase emulators
# Try with .env file first, fallback to without if file doesn't exist

if [ -f .env ]; then
  echo "Starting Firebase emulators with .env file..."
  firebase emulators:start --only functions --env-file .env
else
  echo "Starting Firebase emulators without .env file..."
  firebase emulators:start --only functions
fi

