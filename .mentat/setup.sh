#!/bin/bash

# Install dependencies for both client and server
# The root package.json has an install script that handles this
npm install

# Build the client so port 5000 works immediately
echo "Building client for production..."
cd client
npm run build
cd ..

echo "✅ Setup complete! Client is built and ready."
