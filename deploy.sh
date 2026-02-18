#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Repo root: $ROOT"

# Build the React app (client)
if [ ! -d "$ROOT/client" ]; then
  echo "Error: client directory not found at $ROOT/client"
  exit 1
fi

echo "Installing client dependencies (if needed) and building..."
cd "$ROOT/client"
# install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
  npm install --no-audit --no-fund
fi
npm run build

# Locate build output (vite default is client/dist). Try a few common locations.
BUILD_DIR=""
if [ -d "$ROOT/client/dist" ]; then
  BUILD_DIR="$ROOT/client/dist"
elif [ -d "$ROOT/build" ]; then
  BUILD_DIR="$ROOT/build"
elif [ -d "$ROOT/client/build" ]; then
  BUILD_DIR="$ROOT/client/build"
fi

if [ -z "$BUILD_DIR" ]; then
  echo "Build output not found. Expected one of: client/dist, client/build, build"
  exit 1
fi

echo "Build output located at: $BUILD_DIR"

# Deploy to target directory
TARGET_DIR="/var/www/html/my-react-app"

echo "Creating target directory $TARGET_DIR (requires sudo) and copying files..."
sudo mkdir -p "$TARGET_DIR"
# remove existing contents
sudo rm -rf "$TARGET_DIR"/*
# copy files
sudo cp -r "$BUILD_DIR"/* "$TARGET_DIR"/

# Optionally set ownership to current user:www-data (adjust as needed)
if id -u >/dev/null 2>&1; then
  CURUSER=$(id -un)
  sudo chown -R "$CURUSER":www-data "$TARGET_DIR" || true
fi

# Reload nginx to pick up new files
echo "Reloading nginx (requires sudo)..."
sudo systemctl reload nginx

# Start the API server (server/) on port 3000
if [ ! -d "$ROOT/server" ]; then
  echo "Error: server directory not found at $ROOT/server"
  exit 1
fi

echo "Starting API server in background (logs -> /var/log/os9_phoenix_server.log)"
cd "$ROOT/server"
# install server deps if needed
if [ ! -d "node_modules" ]; then
  npm install --no-audit --no-fund
fi

# Use nohup to run in background; keep log file under /var/log (requires sudo to write there)
LOGFILE="/var/log/os9_phoenix_server.log"
# Ensure log file exists and is writable by current user (via sudo)
sudo touch "$LOGFILE"
sudo chown $(id -u):$(id -g) "$LOGFILE" || true

nohup npm start >"$LOGFILE" 2>&1 &

PID=$!

echo "API server started (pid: $PID). Logs: $LOGFILE"

echo "Deploy complete." 
