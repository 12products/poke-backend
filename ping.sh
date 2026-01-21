#!/bin/bash

# Poke Backend Health Check Script
# Usage: ./ping.sh [endpoint]
# Examples:
#   ./ping.sh           - Check main endpoint
#   ./ping.sh health    - Check detailed health
#   ./ping.sh stats     - Check system stats

set -e

BASE_URL="${POKE_API_URL:-https://poke-backend.onrender.com}"
ENDPOINT="${1:-}"
TIMEOUT="${PING_TIMEOUT:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Poke Backend Health Check${NC}"
echo "================================"
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

check_endpoint() {
    local url="$1"
    local name="$2"

    echo -n "Checking $name... "

    start_time=$(date +%s%N)
    response=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "error")
    end_time=$(date +%s%N)

    duration=$(( (end_time - start_time) / 1000000 ))

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')

    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}OK${NC} (${duration}ms)"
        echo "  Response: $body"
        return 0
    else
        echo -e "${RED}FAILED${NC} (HTTP $http_code)"
        return 1
    fi
}

if [ -z "$ENDPOINT" ]; then
    # Check all endpoints
    check_endpoint "$BASE_URL/v1" "Main"
    check_endpoint "$BASE_URL/v1/health" "Health"
    check_endpoint "$BASE_URL/v1/ping" "Ping"
else
    # Check specific endpoint
    check_endpoint "$BASE_URL/v1/$ENDPOINT" "$ENDPOINT"
fi

echo ""
echo -e "${GREEN}Health check complete!${NC}"
