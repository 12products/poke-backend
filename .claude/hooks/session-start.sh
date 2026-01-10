#!/bin/bash
set -euo pipefail

# Only run in remote environment (Claude Code on the web)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install dependencies
yarn install

# Generate Prisma client (may fail on some platforms due to binary compatibility)
yarn prisma generate || echo "Warning: prisma generate failed, may need Prisma version update"
