# DevImpact Infrastructure & Deployment (ops/)

This directory contains the infrastructure, Docker configuration, cron job definitions, and deployment scripts for the **DevImpact Leaderboard Worker**.

---

## Overview

### What is the Leaderboard Worker?

The Leaderboard Worker is a standalone service that periodically fetches contributor metadata from the GitHub GraphQL/REST APIs, recalculates scores, and updates the shared PostgreSQL database and Redis cache.

### Why is it separate from the web application?

Calculating leaderboard scores involves heavy API querying, rate limit tracking, and database bulk operations. Running this work asynchronously via a background worker ensures that the Next.js web application remains fast, responsive, and unaffected by calculation spikes.

---

## Directory Structure

```
ops/
├── docker/
│   ├── Dockerfile.web                 # Dockerfile for Next.js Web App UI
│   ├── Dockerfile.worker              # Single Dockerfile for Leaderboard Worker
│   ├── .dockerignore                  # Docker build context exclusions
│   ├── entrypoint.sh                  # Worker cron startup entrypoint
│   ├── docker-compose.yml             # Full platform Compose (PostgreSQL, Redis, Web App, Worker)
│   └── leaderboard-compose.yml        # Leaderboard Worker Compose
├── cron/
│   └── leaderboard.cron               # Supercronic job schedule
├── deploy/
│   └── deploy-leaderboard.sh          # VPS deployment automation script
└── README.md                          # Infrastructure documentation
```

---

## Environment Configuration

Copy `.env.example` to `.env` in the root directory before running the worker:

```bash
cp .env.example .env
```

---

## Developer Workflows

### 1. Run Published GHCR Image (Locally or on VPS)

To run the worker using the published container image:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Pull and start container
docker compose -f ops/docker/leaderboard-compose.yml pull
docker compose -f ops/docker/leaderboard-compose.yml up -d
```

### 2. Build Docker Image Directly (Optional Local Testing)

If you want to build the Docker image locally from source:

```bash
docker build \
  -f ops/docker/Dockerfile.worker \
  --build-arg GIT_COMMIT_SHA=$(git rev-parse HEAD) \
  -t devimpact-leaderboard:local \
  .
```

### 3. Manually Run a Single Calculation

To trigger a calculation manually inside a worker container:

```bash
docker compose -f ops/docker/leaderboard-compose.yml run --rm \
  leaderboard-cron \
  pnpm leaderboard:calculate
```

### 4. Inspect Worker Logs

The container logs Supercronic output and script execution directly to `stdout`/`stderr`:

```bash
docker logs -f devimpact-leaderboard-cron
```

---

## CI/CD & GHCR Publishing Workflow

The GitHub Actions workflow at [.github/workflows/leaderboard-image.yml](file:///c:/Users/msii/Documents/DevImpact/.github/workflows/leaderboard-image.yml) triggers automatically on pushes to `main` when worker or scoring code changes.

### Image Naming & Tagging Architecture

- **Registry**: `ghcr.io/o2sa/devimpact-leaderboard`
- **Tags**:
  - `latest`: Latest build from `main` branch.
  - `<commit-sha>` (e.g., `ghcr.io/o2sa/devimpact-leaderboard:a1b2c3d...`): Immutable commit tag for reproducibility and pin/rollback capability.

---

## VPS Deployment

Production deployments on the VPS consume the prebuilt GHCR image.

### Deployment Script

To deploy or update the worker on the VPS:

```bash
bash ops/deploy/deploy-leaderboard.sh
```

This script safely executes:

1. `docker compose -f ops/docker/leaderboard-compose.yml pull`
2. **Waits for any active calculation job to finish**: Checks if `devimpact-leaderboard-cron` is currently running a calculation job (`calculate-next-country`) and polls until the job completes naturally.
3. `docker compose -f ops/docker/leaderboard-compose.yml up -d --remove-orphans` once no calculation is running.

### Rolling Back to a Specific Version

To rollback to a previous version on the VPS, set the `LEADERBOARD_IMAGE` variable to an explicit commit SHA tag before executing:

```bash
LEADERBOARD_IMAGE=ghcr.io/o2sa/devimpact-leaderboard:<commit-sha> bash ops/deploy/deploy-leaderboard.sh
```

---

## Concurrent Job Handling & Locking Note

The leaderboard script uses database-level tracking (`leaderboard_calculation` table with `status = 'running'`). The query selects the next country where `status != 'running'`, preventing the worker from picking a country currently being processed.

---

## Security Best Practices

1. **Non-Root & Unprivileged**: The container runs under standard user permissions without `--privileged` or Docker socket access.
2. **Runtime Injection**: All credentials (`GITHUB_TOKEN`, `DATABASE_URL`) are passed at container startup via environment variables.
