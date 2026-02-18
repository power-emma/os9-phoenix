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

# Some nginx configs expect the app to be served from a `build` subdirectory (see /etc/nginx/conf.d/react.conf).
# If any nginx config references /var/www/html/my-react-app/build, mirror the build into that subdirectory too.
if sudo grep -R "/var/www/html/my-react-app/build" /etc/nginx -n >/dev/null 2>&1; then
  echo "Nginx expects files under $TARGET_DIR/build — creating and copying build there too"
  sudo rm -rf "$TARGET_DIR/build"
  sudo mkdir -p "$TARGET_DIR/build"
  sudo cp -r "$BUILD_DIR"/* "$TARGET_DIR/build/"
  # set ownership similar to parent
  if [ -n "$WEB_GROUP" ]; then
    sudo chown -R "$CURUSER":$WEB_GROUP "$TARGET_DIR/build" || true
  else
    sudo chown -R "$CURUSER":"$CURUSER" "$TARGET_DIR/build" || true
  fi
fi

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

# Install nginx site config for this app (serve static build and proxy /api to backend)
NGINX_CONF="/etc/nginx/conf.d/os9_phoenix.conf"
echo "Writing nginx config to $NGINX_CONF (requires sudo)"
sudo bash -c "cat > $NGINX_CONF" <<'NGCONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/html/my-react-app/build;
    index index.html;

    access_log /var/log/nginx/os9_phoenix.access.log;
    error_log  /var/log/nginx/os9_phoenix.error.log warn;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: serve static assets with long cache
    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp|ttf|woff2?)$ {
        try_files $uri =404;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGCONF

# Ensure log files exist and are writable by nginx
sudo touch /var/log/nginx/os9_phoenix.access.log /var/log/nginx/os9_phoenix.error.log || true
if [ -n "$WEB_GROUP" ]; then
  sudo chown root:$WEB_GROUP /var/log/nginx/os9_phoenix.* || true
fi

echo "Testing nginx configuration"
if ! sudo nginx -t; then
  echo "nginx config test FAILED — showing $NGINX_CONF"
  sudo sed -n '1,200p' "$NGINX_CONF" || true
  sudo systemctl status nginx --no-pager || true
  if [ -f /var/log/nginx/error.log ]; then sudo tail -n 50 /var/log/nginx/error.log || true; fi
  echo "Aborting deploy due to nginx config test failure"
  exit 1
fi

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

echo "Configuring and starting API server via systemd"
cd "$ROOT/server"
# install server deps if needed
if [ ! -d "node_modules" ]; then
  npm install --no-audit --no-fund
fi

# Determine service name and path
SERVICE_NAME="os9_phoenix_api.service"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME"

# Stop any existing systemd service instance
if sudo systemctl list-units --full -all | grep -q "$SERVICE_NAME"; then
  echo "Stopping existing systemd service $SERVICE_NAME"
  sudo systemctl stop "$SERVICE_NAME" || true
fi

# Kill any process currently listening on required ports (to avoid EADDRINUSE)
# Configure ports we want to free before starting the API. Add more ports if needed.
PORTS_TO_FREE=(3000)
for P in "${PORTS_TO_FREE[@]}"; do
  if sudo ss -ltnp 2>/dev/null | grep -q ":${P}\b"; then
    echo "Found process(es) listening on :${P} — attempting to kill"
    # list PIDs listening on the port
    PIDS=$(sudo lsof -iTCP:${P} -sTCP:LISTEN -t || true)
    if [ -n "$PIDS" ]; then
      echo "Killing PIDs on port ${P}: $PIDS"
      echo "$PIDS" | xargs -r sudo kill -9 || true
      # small pause to allow sockets to be released
      sleep 1
    else
      echo "No PIDs found by lsof for port ${P}, attempting to find via ss"
      # fallback: extract PIDs from ss output
      SSSPIDS=$(sudo ss -ltnp 2>/dev/null | grep ":${P}\b" | sed -n 's/.*pid=\([0-9]*\),.*/\1/p' | tr '\n' ' ')
      if [ -n "$SSSPIDS" ]; then
        echo "Killing PIDs on port ${P} (from ss): $SSSPIDS"
        echo "$SSSPIDS" | xargs -r sudo kill -9 || true
        sleep 1
      fi
    fi
  else
    echo "No process listening on port ${P}"
  fi
done

echo "Writing systemd unit to $SERVICE_PATH (requires sudo)"
sudo tee "$SERVICE_PATH" > /dev/null <<EOF
[Unit]
Description=os9-phoenix API
After=network.target

[Service]
Type=simple
User=$CURUSER
WorkingDirectory=$ROOT/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/env npm start
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo chmod 644 "$SERVICE_PATH"
sudo systemctl daemon-reload
sudo systemctl enable --now "$SERVICE_NAME"

echo "Started systemd service: $SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager || true

echo "Recent journal for $SERVICE_NAME (last 60 lines):"
sudo journalctl -u "$SERVICE_NAME" -n 60 --no-pager || true

echo "Deploy complete."

# Print helpful diagnostics for 500 responses: show the last bit of nginx and server logs
echo "--- Diagnostic summary ---"
if [ -f /var/log/nginx/error.log ]; then
  echo "Recent nginx errors (last 30 lines):"
  sudo tail -n 30 /var/log/nginx/error.log || true
else
  echo "No /var/log/nginx/error.log found"
fi

echo "Deployed files (top of $TARGET_DIR):"
sudo ls -la "$TARGET_DIR" | head -n 40 || true

echo "Searching nginx configs for references to the deployed directory or proxy settings:"
sudo grep -R "my-react-app\|/var/www/html/my-react-app\|proxy_pass\|root \|location" /etc/nginx -n || true

echo "Recent API journal for $SERVICE_NAME (last 60 lines):"
sudo journalctl -u "$SERVICE_NAME" -n 60 --no-pager || true

echo "If you still see 500 errors, check the above logs and ensure nginx is configured to serve $TARGET_DIR and/or proxy to the API on port 3000."
