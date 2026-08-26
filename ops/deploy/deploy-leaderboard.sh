#!/usr/bin/env bash
set -euo pipefail

# Determine script directory, project root, and compose file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../docker/leaderboard-compose.yml"
ENV_FILE="${PROJECT_ROOT}/.env"

echo "=================================================="
echo " DevImpact Leaderboard Worker Deployment"
echo "=================================================="
echo "Project Root: ${PROJECT_ROOT}"
echo "Compose File: ${COMPOSE_FILE}"

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Error: Compose file not found at ${COMPOSE_FILE}" >&2
  exit 1
fi

ENV_ARGS=()
if [ -f "${ENV_FILE}" ]; then
  echo "Env File:     ${ENV_FILE} (found)"
  ENV_ARGS+=(--env-file "${ENV_FILE}")
else
  echo "Warning: .env file not found at ${ENV_FILE}. Proceeding with system environment..." >&2
fi

echo "[1/3] Pulling latest GHCR image..."
docker compose --project-directory "${PROJECT_ROOT}" "${ENV_ARGS[@]}" -f "${COMPOSE_FILE}" pull

# Check if worker container is running and an active calculation is in progress
CONTAINER_NAME="devimpact-leaderboard-cron"
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[2/3] Checking for active leaderboard calculation..."
  while docker exec "${CONTAINER_NAME}" pgrep -f "calculate-next-country" > /dev/null 2>&1 || \
        docker exec "${CONTAINER_NAME}" sh -c 'ps aux | grep -v grep | grep -q "calculate-next-country"'; do
    echo "  >> A leaderboard calculation job is currently running. Waiting for it to finish..."
    sleep 10
  done
  echo "  >> No active calculation running (or active calculation completed)."
else
  echo "[2/3] Worker container is not running yet."
fi

echo "[3/3] Recreating leaderboard worker container with new image..."
docker compose --project-directory "${PROJECT_ROOT}" "${ENV_ARGS[@]}" -f "${COMPOSE_FILE}" up -d --remove-orphans

echo "=================================================="
echo " Leaderboard Worker Deployed Successfully!"
echo "=================================================="
