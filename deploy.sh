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

# Optionally set ownership to current user:web-group (adjust as needed)
if id -u >/dev/null 2>&1; then
  CURUSER=$(id -un)
  # detect a reasonable web group on the host; common values: www-data, nginx, apache
  WEB_GROUP=""
  for g in www-data nginx apache www; do
    if getent group "$g" >/dev/null 2>&1; then
      WEB_GROUP="$g"
      break
    fi
  done
  if [ -z "$WEB_GROUP" ]; then
    echo "No common web group (www-data/nginx/apache) found on system; setting ownership to ${CURUSER} only"
    sudo chown -R "$CURUSER":"$CURUSER" "$TARGET_DIR" || true
  else
    echo "Detected web group: $WEB_GROUP — setting ownership to ${CURUSER}:$WEB_GROUP"
    sudo chown -R "$CURUSER":$WEB_GROUP "$TARGET_DIR" || true
  fi
fi

# Reload nginx to pick up new files
sudo systemctl reload nginx
echo "Reloading nginx (requires sudo)..."
if ! sudo systemctl reload nginx; then
  echo "nginx reload failed — printing nginx status and recent error log lines"
  sudo systemctl status nginx --no-pager || true
  if [ -f /var/log/nginx/error.log ]; then
    echo "--- /var/log/nginx/error.log (last 50 lines) ---"
    sudo tail -n 50 /var/log/nginx/error.log || true
  fi
else
  echo "nginx reloaded successfully"
fi

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

# Print helpful diagnostics for 500 responses: show the last bit of nginx and server logs
echo "--- Diagnostic summary ---"
if [ -f /var/log/nginx/error.log ]; then
  echo "Recent nginx errors (last 30 lines):"
  sudo tail -n 30 /var/log/nginx/error.log || true
else
  echo "No /var/log/nginx/error.log found"
fi

if [ -f "$LOGFILE" ]; then
  echo "Recent API server log (last 60 lines): $LOGFILE"
  tail -n 60 "$LOGFILE" || true
else
  echo "API server log $LOGFILE not found"
fi

echo "If you still see 500 errors, check the above logs and ensure nginx is configured to serve $TARGET_DIR and/or proxy to the API on port 3000."
