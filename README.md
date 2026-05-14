# SQP Kanban

A containerised kanban board application deployed to a homelab server via CI/CD pipeline.

## Architecture

```
GitHub (merge to main)
  → GitHub Actions (self-hosted runner on Bitfrost)
    → docker compose up -d --build
      → sqp-kanban (Node.js / Express, port 4000)
      → sqp-mongo  (MongoDB 8, persistent volume)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/JS |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB 8 |
| Containerisation | Docker, Docker Compose |
| CI/CD | GitHub Actions, self-hosted runner |
| Deployment target | Ubuntu Server (homelab) |

## How It Works

The app runs as two Docker containers on a shared network — one for the Node.js application, one for MongoDB. Data is persisted in a named Docker volume.

Deployment is automated: merging a pull request to `main` triggers a GitHub Actions workflow that runs on a self-hosted runner installed on the target server. The workflow checks out the code and runs `docker compose up -d --build`.

## Running Locally

```bash
docker compose up -d
```

The app is available at `http://localhost:4000`.

To stop:

```bash
docker compose down
```

## Project Structure

```
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions deploy workflow
├── public/
│   └── index.html          # Frontend (single-page app)
├── Dockerfile              # App container image
├── docker-compose.yml      # Multi-container orchestration
├── server.js               # Express API server
├── package.json
└── .env                    # Environment variables (not committed)
```

## Deployment Pipeline

```
dev branch → push → PR to main → merge → GitHub Actions → Bitfrost
```

1. Development happens on the `dev` branch
2. Changes are pushed and a pull request is opened to `main`
3. On merge, GitHub Actions triggers the deploy workflow
4. The self-hosted runner on my homelab server, Bitfrost, pulls the latest code
5. `docker compose up -d --build` rebuilds and restarts the containers

## Lessons Learned

- Mongoose subdocument schemas default `_id` to `ObjectId` — frontend-generated UUIDs need `_id: { type: String }` in the schema
- `crypto.randomUUID()` only works in secure contexts (HTTPS or localhost) — a fallback is needed for HTTP deployments on LAN IPs
- `podman-compose` doesn't support all Docker Compose shorthands — explicit `build` and `volume` syntax ensures compatibility with both tools
- Self-hosted runners on public repos require fork PR approval policies to prevent unauthorised code execution
