#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/hips-server"
BRANCH="master"

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "Missing git repository at ${APP_DIR}. Run deploy/ec2/bootstrap.sh first."
  exit 1
fi

cd "${APP_DIR}"

git fetch --all
git reset --hard "origin/${BRANCH}"

npm ci
npm run lint
npm run build

sudo systemctl daemon-reload
sudo systemctl restart hips-server
sudo systemctl status hips-server --no-pager
