#!/bin/sh
set -e

# Default to daily execution at midnight if LEADERBOARD_CRON_SCHEDULE is not set
CRON_EXPR="${LEADERBOARD_CRON_SCHEDULE:-0 0 * * *}"

echo "Configuring leaderboard cron schedule: ${CRON_EXPR}"
echo "${CRON_EXPR} cd /app && pnpm leaderboard:calculate >> /proc/1/fd/1 2>> /proc/1/fd/2" > /etc/leaderboard.cron

# Execute supercronic
exec supercronic /etc/leaderboard.cron
