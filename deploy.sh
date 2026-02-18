#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Repo root: $ROOT"

# initialize user/group defaults to avoid unbound-variable errors when script is run with sudo
CURUSER=$(id -un 2>/dev/null || echo "root")
WEB_GROUP=""

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
# Build with PUBLIC_URL set to '/' so assets are referenced from the current host root
# This overrides the package.json "homepage" or package-level defaults that may point to an external domain.
echo "Building client with PUBLIC_URL=/ to produce site-root-relative asset URLs"
PUBLIC_URL="/" npm run build

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

echo "Preparing an atomic deploy into $TARGET_DIR (build copied into a temp dir, verified, then swapped in)."

# Create a temporary staging area for the freshly-built site (local, not owned by root)
TS=$(date +%s)
TMP_STAGING=$(mktemp -d "/tmp/os9_phoenix_build.${TS}.XXXX")
echo "Copying build output into staging area: $TMP_STAGING"
cp -r "$BUILD_DIR"/* "$TMP_STAGING"/

# Ensure index.html exists in the staging area
if [ ! -f "$TMP_STAGING/index.html" ]; then
  echo "Error: expected $TMP_STAGING/index.html not found. Build may have failed or output layout is unexpected."
  exit 1
fi

# Check for any remaining hard-coded production domain entries in the freshly-built files.
PROD_DOMAIN="https://poweremma.com"
echo "Scanning staging files for occurrences of $PROD_DOMAIN..."
STAGE_OCCURRENCES=$(grep -R --line-number --binary-files=without-match "$PROD_DOMAIN" "$TMP_STAGING" || true)
if [ -n "$STAGE_OCCURRENCES" ]; then
  echo "Found occurrences of $PROD_DOMAIN in the freshly-built files. Will rewrite them in the staging area before deploy."
  # Replace in-place in staging (create .bak backups there)
  find "$TMP_STAGING" -type f -exec sed -i.bak "s|$PROD_DOMAIN||g" {} + || true
  echo "Rewrote $PROD_DOMAIN -> '' in staging files (backups with .bak created in $TMP_STAGING)."
else
  echo "No $PROD_DOMAIN occurrences found in staging build."
fi

# Compute checksum of the staging index.html for verification and diagnostic reporting
STAGE_SUM=$(sha256sum "$TMP_STAGING/index.html" | cut -d' ' -f1 || true)
echo "Staging index.html sha256: $STAGE_SUM"

# Prepare target new dir and copy staging into it (use sudo because target is owned by root/nginx)
TARGET_NEW="${TARGET_DIR}.new.${TS}"
echo "Creating target staging dir: $TARGET_NEW"
sudo rm -rf "$TARGET_NEW" || true
sudo mkdir -p "$TARGET_NEW"
sudo cp -r "$TMP_STAGING"/* "$TARGET_NEW"/

# If any nginx configs reference $TARGET_DIR/build, mirror into a build subdir as well (for compatibility)
if sudo grep -R "/var/www/html/my-react-app/build" /etc/nginx -n >/dev/null 2>&1; then
  echo "Detected nginx configs expecting $TARGET_DIR/build — mirroring into $TARGET_NEW/build"
  sudo rm -rf "$TARGET_NEW/build" || true
  sudo mkdir -p "$TARGET_NEW/build"
  sudo cp -r "$TMP_STAGING"/* "$TARGET_NEW/build/"
fi

# Run the same post-deploy rewrite safety check on the target-new dir (extra safeguard)
echo "Final scan of $TARGET_NEW for $PROD_DOMAIN (should be none)..."
sudo grep -R --line-number --binary-files=without-match "$PROD_DOMAIN" "$TARGET_NEW" || true
sudo find "$TARGET_NEW" -type f -exec sed -i.bak "s|$PROD_DOMAIN||g" {} + || true

# Compute checksum of the to-be-deployed index.html
DEPLOY_SUM=$(sudo sha256sum "$TARGET_NEW/index.html" | cut -d' ' -f1 || true)
echo "Prepared deploy index.html sha256: $DEPLOY_SUM"

if [ "$STAGE_SUM" != "$DEPLOY_SUM" ]; then
  echo "Warning: staging checksum ($STAGE_SUM) differs from prepared deploy checksum ($DEPLOY_SUM)."
fi

# Atomically swap the directories: move current -> backup, move new -> current
BACKUP_DIR="${TARGET_DIR}.bak.${TS}"
echo "Performing atomic swap: $TARGET_DIR -> $BACKUP_DIR ; $TARGET_NEW -> $TARGET_DIR"
if [ -d "$TARGET_DIR" ]; then
  sudo mv "$TARGET_DIR" "$BACKUP_DIR" || true
fi
sudo mv "$TARGET_NEW" "$TARGET_DIR" || (echo "Failed to move $TARGET_NEW -> $TARGET_DIR" && exit 1)

# Optionally keep the backup for quick rollback; remove backups older than 7 days
echo "Cleaning up old backups (older than 7 days) under /var/www/html..."
sudo find /var/www/html -maxdepth 1 -name 'my-react-app.bak.*' -type d -mtime +7 -exec rm -rf {} + || true

# Set ownership on the freshly-deployed directory
if [ -n "$WEB_GROUP" ]; then
  echo "Setting ownership of $TARGET_DIR to $CURUSER:$WEB_GROUP"
  sudo chown -R "$CURUSER":$WEB_GROUP "$TARGET_DIR" || true
else
  echo "Setting ownership of $TARGET_DIR to $CURUSER:$CURUSER"
  sudo chown -R "$CURUSER":"$CURUSER" "$TARGET_DIR" || true
fi

# Remove staging temp directory
rm -rf "$TMP_STAGING" || true
echo "Atomic deploy complete. New site at $TARGET_DIR (index.html sha256: $DEPLOY_SUM). Backup kept at $BACKUP_DIR."

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
