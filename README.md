# TaskForge - AI Task Processing Platform

TaskForge is a production-ready MERN-style task processing platform with a Python background worker. Users register, log in, create text-processing jobs, and watch asynchronous workers move those jobs through `pending`, `running`, `success`, and `failed` states.

## Repository Links

- Application repository: `https://github.com/Abdul-012/AI-Task-Processing-Platform`
- Infrastructure repository: `https://github.com/Abdul-012/AI-Task-Processing-Platform-Infra`

## Services

| Service | Stack | Responsibility |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Nginx | Authenticated task console, task creation, polling, logs, results |
| Backend API | Node.js, Express, MongoDB, Redis Streams | JWT auth, validation, task persistence, queue publishing |
| Worker | Python, Redis, MongoDB | Consumer group processing, status updates, logs, stale job reclaim |
| Database | MongoDB | Users, tasks, task logs, results |
| Queue | Redis Streams | Durable queue with consumer groups for horizontally scaled workers |

## Features

- User registration and login with bcrypt password hashing and JWT authentication.
- Create tasks with `uppercase`, `lowercase`, `reverse`, and `word_count` operations.
- Background processing through Redis Streams.
- Task status tracking: `pending`, `running`, `success`, `failed`.
- Task logs and results visible from the dashboard.
- Retry endpoint for failed tasks.
- Helmet, rate limiting, input validation, non-root Docker images, and no committed real secrets.
- Docker Compose for local development.
- Kubernetes manifests and Argo CD GitOps configuration in the separate infra repository.
- CI/CD pipeline for linting, testing, image builds, registry pushes, and infra tag updates.

## Local Development With Docker Compose

Prerequisites:

- Node.js 20+
- Python 3.12+
- Docker and Docker Compose

Run:

```bash
cp .env.example .env
openssl rand -base64 48
# Paste the generated value into JWT_SECRET in .env
docker compose up --build
```

Open:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:4000/health/ready`

Scale workers locally:

```bash
docker compose up --scale worker=3
```

## Local Development Without Docker

Start MongoDB and Redis locally, then use these commands in separate terminals:

```bash
cd backend
npm install
npm run dev
```

```bash
cd worker
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
python -m app.worker
```

```bash
cd frontend
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env`. Required values:

| Variable | Description |
| --- | --- |
| `JWT_SECRET` | Long random secret, minimum 32 characters |
| `MONGO_URI` | MongoDB connection string |
| `MONGO_DB` | Database name used by the worker |
| `REDIS_URL` | Redis connection string |
| `REDIS_STREAM_KEY` | Redis Stream used as the task queue |
| `REDIS_CONSUMER_GROUP` | Consumer group shared by worker replicas |
| `FRONTEND_ORIGIN` | Comma-separated allowed CORS origins |

## API Summary

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Create account |
| `POST` | `/api/auth/login` | No | Login and receive JWT |
| `GET` | `/api/auth/me` | Yes | Current user |
| `POST` | `/api/tasks` | Yes | Create and queue a task |
| `GET` | `/api/tasks` | Yes | List tasks, optional `status` filter |
| `GET` | `/api/tasks/:id` | Yes | Task details, logs, result |
| `POST` | `/api/tasks/:id/retry` | Yes | Retry failed task |
| `GET` | `/health/live` | No | Liveness probe |
| `GET` | `/health/ready` | No | Readiness probe |

Example task request:

```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Normalize copy","inputText":"Hello World","operation":"lowercase"}'
```

## CI/CD

The GitHub Actions workflow at `.github/workflows/ci-cd.yml` performs:

- Backend lint and unit tests.
- Frontend lint and production build.
- Worker lint and unit tests.
- Docker image builds for frontend, backend, and worker.
- Push to Docker Hub.
- Automatic update of image tags in the infrastructure repository.

Required GitHub secrets:

| Secret | Purpose |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub namespace |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `INFRA_REPOSITORY` | Infra repo slug, for example `your-org/ai-task-platform-infra` |
| `INFRA_REPO_TOKEN` | Token with write access to infra repo |

Main branch pushes deploy to staging. Version tags like `v1.0.0` update the production overlay.

## Repository Split

Create the application repository:

```bash
cd ai-task-platform-app
git init
git add .
git commit -m "initial application platform"
git remote add origin git@github.com:Abdul-012/AI-Task-Processing-Platform.git
git push -u origin main
```

Create the infrastructure repository:

```bash
cd ../ai-task-platform-infra
git init
git add .
git commit -m "initial gitops infrastructure"
git remote add origin git@github.com:Abdul-012/AI-Task-Processing-Platform-Infra.git
git push -u origin main
```

Update image names and Argo CD `repoURL` placeholders before deploying.

## Documentation

- Architecture: `docs/ARCHITECTURE.md`
- Infrastructure runbook: `../ai-task-platform-infra/README.md`
