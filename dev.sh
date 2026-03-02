#!/bin/bash

# Start the server in the background
echo "Starting server on port 3001..."
(cd server && npm run dev) &
SERVER_PID=$!

# Wait a bit for the server to start
sleep 2

# Start the client in the background
echo "Starting client..."
(cd client && npm start) &
CLIENT_PID=$!

echo ""
echo "Server and client are running."
echo "Press Enter to stop both processes..."
read

# Kill both processes and their children
echo "Stopping server and client..."
pkill -P $SERVER_PID 2>/dev/null
kill $SERVER_PID 2>/dev/null
pkill -P $CLIENT_PID 2>/dev/null
kill $CLIENT_PID 2>/dev/null

echo "Done."
