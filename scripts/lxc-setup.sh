#!/bin/bash
set -euxo pipefail

ROOT_DIR="$(dirname "$0")/.."
INSTALL_DIR="/srv/vacuula"

# System dependencies
apt-get update
apt-get install -y \
    curl \
    openssl \
    python3 \
    python3-pip \
    nodejs \
    npm

# Frontend
cd "$ROOT_DIR/app"

corepack enable
pnpm approve-builds @parcel/watcher
pnpm install --frozen-lockfile
pnpm vite build

# Python dependencies
cd "$ROOT_DIR/server"

python3 -m pip install --no-cache-dir --upgrade pip
python3 -m pip install --no-cache-dir -r requirements.txt

# Install application
mkdir -p "$INSTALL_DIR"

rm -rf "$INSTALL_DIR/src"
rm -rf "$INSTALL_DIR/migrations"
rm -rf "$INSTALL_DIR/web"

cp -r "$ROOT_DIR/server/src" "$INSTALL_DIR/src"
cp -r "$ROOT_DIR/server/migrations" "$INSTALL_DIR/migrations"
cp "$ROOT_DIR/server/alembic.ini" "$INSTALL_DIR/alembic.ini"

mkdir -p "$INSTALL_DIR/data/ssl"

cp "$ROOT_DIR/server/data/ssl/vacuula.cnf" \
    "$INSTALL_DIR/data/ssl/vacuula.cnf"

cp -r "$ROOT_DIR/app/dist" "$INSTALL_DIR/web"

# Install systemd service
cp "$ROOT_DIR/vacuula.service" /etc/systemd/system/vacuula.service

systemctl daemon-reload
systemctl enable vacuula

# Database migrations
cd "$INSTALL_DIR"
alembic upgrade head

# Start
systemctl restart vacuula

echo "Vacuula installed successfully."