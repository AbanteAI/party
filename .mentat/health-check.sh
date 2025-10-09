#!/bin/bash

echo "🏥 Running Mentat Party Health Check..."
echo ""

# Check branch
BRANCH=$(git branch --show-current)
echo "📍 Current branch: $BRANCH"
if [ "$BRANCH" != "mentat-1" ]; then
  echo "⚠️  WARNING: You're not on the mentat-1 branch!"
  echo "   Run: git checkout mentat-1"
fi
echo ""

# Check if client is built
if [ -d "client/dist" ]; then
  echo "✅ Client is built (client/dist exists)"
else
  echo "❌ Client is NOT built!"
  echo "   Run: cd client && npm run build"
fi
echo ""

# Check if node_modules exist
if [ -d "node_modules" ] && [ -d "client/node_modules" ] && [ -d "server/node_modules" ]; then
  echo "✅ Dependencies are installed"
else
  echo "❌ Dependencies are NOT fully installed!"
  echo "   Run: npm install"
fi
echo ""

# Check if servers are running
if lsof -i :5000 > /dev/null 2>&1; then
  echo "✅ Server is running on port 5000"
else
  echo "⚠️  Server is NOT running on port 5000"
  echo "   Run: cd server && npm run dev"
fi

if lsof -i :5173 > /dev/null 2>&1; then
  echo "✅ Client dev server is running on port 5173"
else
  echo "⚠️  Client dev server is NOT running on port 5173"
  echo "   Run: cd client && npm run dev"
fi
echo ""

# Test API endpoint
if curl -s http://localhost:5000/api/messages > /dev/null 2>&1; then
  echo "✅ API is responding"
else
  echo "❌ API is NOT responding"
fi
echo ""

echo "🏥 Health check complete!"
