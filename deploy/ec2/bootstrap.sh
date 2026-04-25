#!/usr/bin/env bash
set -euo pipefail

# One-time bootstrap for Ubuntu 22.04 EC2.
# Replace these placeholders before running.
APP_DIR="/opt/hips-server"
REPO_URL="https://github.com/<YOUR_GITHUB_ORG_OR_USER>/<YOUR_REPO>.git"
APP_DOMAIN="<SERVER_DOMAIN_PLACEHOLDER>"
APP_USER="ubuntu"

sudo apt-get update
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js 20 from NodeSource.
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo mkdir -p "${APP_DIR}"
sudo chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

if [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
npm ci

cat <<'EOF' | sudo tee /etc/systemd/system/hips-server.service
[Unit]
Description=Hips Socket Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/hips-server
Environment=NODE_ENV=prod
Environment=PORT=8000
Environment=ALLOWED_ORIGINS=https://jdshaeffer.github.io
ExecStart=/usr/bin/node --import tsx/esm server/socketServer.ts
Restart=always
RestartSec=3
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
EOF

cat <<EOF | sudo tee /etc/nginx/sites-available/hips-server
server {
  listen 80;
  server_name ${APP_DOMAIN};

  location /socket.io/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 86400;
  }
}
EOF

sudo ln -sf /etc/nginx/sites-available/hips-server /etc/nginx/sites-enabled/hips-server
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

sudo systemctl daemon-reload
sudo systemctl enable hips-server
sudo systemctl restart hips-server

# Optional TLS enablement (requires DNS already pointed to this instance).
echo "If DNS is ready, run:"
echo "sudo certbot --nginx -d ${APP_DOMAIN}"
