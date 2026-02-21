#!/bin/bash
# Deploy OpenClaw Idle RPG to Vercel (link + prod deploy)
set -euo pipefail

APP_NAME="openclaw-idle-rpg"

echo "Deploying $APP_NAME to Vercel..."

# If standalone dir doesn't exist, run setup first
TMP_DIR="/tmp/openclaw-idle-rpg-standalone"
if [ ! -d "$TMP_DIR" ]; then
  echo "Standalone repo not found. Running setup..."
  bash setup-standalone-repo.sh
fi

cd "$TMP_DIR"

# Link if not already linked
if ! vercel ls --scope 2>/dev/null | grep -q "$APP_NAME"; then
  echo "Linking Vercel project..."
  vercel link --project "$APP_NAME" --confirm
fi

# Deploy to production with public flag
echo "Deploying to production..."
vercel --prod --public --confirm

echo "✅ Deployed! Check: https://$APP_NAME.vercel.app (or similar)"
