#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR/backend"
if [ -f ../.env ]; then export $(grep -v '^#' ../.env | grep -v '^$' | xargs); fi
echo "Starting AICommunityCoopTimeBankPlatform backend..."
node server.js
