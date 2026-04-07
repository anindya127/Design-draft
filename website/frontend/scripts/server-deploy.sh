#!/bin/bash
set -e

REPO_DIR="/root/gcss-repo"
WEB_DIR="/var/www/gcss-website"
FRONTEND_DIR="$REPO_DIR/website/frontend"

echo "========================================="
echo "  GCSS Auto Deploy from GitHub"
echo "========================================="

# Step 1: Pull latest from GitHub
echo ""
echo "[1/5] Pulling latest code from GitHub..."
cd "$REPO_DIR"
git pull origin main

# Step 2: Install dependencies
echo ""
echo "[2/5] Installing dependencies..."
cd "$FRONTEND_DIR"
npm install --production=false

# Step 3: Build the site
echo ""
echo "[3/5] Building the site..."
npm run build

# Step 4: Clean the web directory
echo ""
echo "[4/5] Cleaning web directory..."
rm -rf "$WEB_DIR"/*

# Step 5: Copy build output
echo ""
echo "[5/5] Deploying to web server..."
cp -r "$FRONTEND_DIR/out/"* "$WEB_DIR/"

echo ""
echo "========================================="
echo "  Deploy complete!"
echo "  Site live at: http://47.242.75.250"
echo "========================================="
