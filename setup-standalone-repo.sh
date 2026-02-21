#!/bin/bash
# Setup OpenClaw Idle RPG as a standalone repo and push to GitHub
set -euo pipefail

WORKSPACE="/home/ubuntu/.openclaw/workspace"
APP_DIR="$WORKSPACE/apps/openclaw-idle-rpg"
TMP_DIR="/tmp/openclaw-idle-rpg-standalone"
REPO_NAME="openclaw-idle-rpg"

echo "=== OpenClaw Idle RPG: Standalone Repo Setup ==="

# Clean temp dir
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

# Copy app files but exclude node_modules and heavy build artifacts
rsync -av --exclude='node_modules' --exclude='.next' --exclude='out' --exclude='build' "$APP_DIR"/ "$TMP_DIR"/

cd "$TMP_DIR"

# Run prebuild (if any)
bash prebuild.sh

# Initialize git if not already
if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "Initial commit"
else
  echo "Git repo already exists, adding all changes..."
  git add .
  git commit -m "Update" || true
fi

# Create GitHub repo via gh, or use existing
if command -v gh &>/dev/null; then
  echo "Setting up GitHub remote for $REPO_NAME"
  # Try to create; if already exists, just set remote and push
  if gh repo create "$REPO_NAME" --public --source=. --remote=origin --push 2>/dev/null; then
    echo "Repository created and linked."
  else
    echo "Repository may already exist. Configuring remote manually..."
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$(gh api user | jq -r .login)/$REPO_NAME.git"
    git push -u origin master --force
  fi
else
  echo "gh not found; please create repo manually and add remote 'origin' pushing to GitHub."
fi

echo ""
echo "Setup complete! Next steps:"
echo "1. Verify repo: https://github.com/$(gh api user | jq -r .login)/$REPO_NAME"
echo "2. Deploy to Vercel:"
echo "   cd $TMP_DIR"
echo "   vercel link --project $REPO_NAME"
echo "   vercel --prod --public"
echo "3. Update docs with the production URL."
