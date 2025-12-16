#!/bin/bash

# Load .env file
if [ -f .env ]; then
  export $(cat .env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

echo "Setting Firebase Secrets..."

# helper function to set secret if value exists
set_secret() {
  local key=$1
  local value=$2
  
  if [ -n "$value" ]; then
    echo "Setting $key..."
    # Pipe the value into the command to avoid interactive prompt
    echo -n "$value" | firebase functions:secrets:set "$key"
  else
    echo "Warning: $key is not set in .env using placeholder or skipping..."
  fi
}

set_secret "RESEND_API_KEY" "$RESEND_API_KEY"
set_secret "EMAIL_FROM_ADDRESS" "$EMAIL_FROM_ADDRESS"

echo "Done! Secrets updated. You may need to redeploy functions for changes to take effect:"
echo "npm run deploy:functions"
