# Architecture Document

## 1. System Overview

TaskForge is split into five services: React frontend, Express backend, Python worker, MongoDB, and Redis. The frontend talks only to the backend API. The backend owns authentication, validation, task creation, and queue publishing. The worker owns task execution and status transitions after a task is published.

The task lifecycle is:

1. A user creates a task from the React console.
2. The backend validates the request, creates a MongoDB task with `pending` status, and publishes a Redis Streams message.
3. One Python worker in the Redis consumer group receives the message.
4. The worker marks the task `running`, executes the operation, appends logs, and writes `success` with a result or `failed` with an error.
5. The frontend polls the API while tasks are active and renders logs and results.

Redis Streams were chosen over a simple list because consumer groups provide safer multi-worker scaling, per-message acknowledgement, and a pending-entry list that allows another worker to reclaim stale work after a crash.

## 2. Worker Scaling Strategy

Workers are stateless. Each replica uses the same Redis stream key and consumer group, with a unique consumer name based on the pod name. Redis delivers each task message to one consumer in the group, so increasing worker replicas increases parallel processing capacity without duplicating work.

Kubernetes deploys the worker as a `Deployment` with a HorizontalPodAutoscaler. Staging starts with two replicas and production starts with three replicas. Production allows up to twenty replicas. CPU utilization is the default HPA signal in the manifests, and the architecture can be extended with KEDA to scale directly from Redis Stream lag.

Worker crash handling:

- A worker acknowledges a stream message only after the MongoDB task has been updated.
- If a worker dies while processing, Redis keeps the message in the consumer group's pending list.
- Active workers periodically call `XAUTOCLAIM` and reclaim stale pending messages.
- Task updates are guarded by status checks so already completed tasks are not processed again.

For long-running real AI jobs, the same worker contract can be extended with per-operation timeouts, idempotency keys, and task-specific retry policies.

## 3. Handling High Task Volume: 100k Tasks Per Day

100k tasks/day averages around 1.2 tasks/second, but production planning should assume bursts. The platform separates web traffic from processing throughput:

- The backend stays responsive because it only validates, writes MongoDB, and enqueues Redis messages.
- Redis absorbs bursts through the stream.
- Workers scale horizontally to drain backlog.
- MongoDB indexes keep task listing and worker status updates efficient.

Recommended production settings for this volume:

- Run backend with at least three replicas behind the Kubernetes service.
- Run worker HPA with a minimum of three replicas and a maximum based on benchmarked processing time.
- Monitor Redis stream length, pending entries, worker processing latency, MongoDB write latency, and API p95 latency.
- Add KEDA Redis scaler when queue lag should directly control worker replicas.
- Use managed MongoDB or a properly replicated MongoDB cluster for production instead of a single in-cluster StatefulSet.
- Archive old task logs/results to cheaper storage if retention grows beyond operational needs.

Capacity example:

If one worker processes 10 simple text jobs/second, three workers can process roughly 2.5 million jobs/day at steady state. Real AI workloads will be slower, so scaling should be based on measured p95 job duration and acceptable queue wait time.

## 4. Database Indexing Strategy

MongoDB stores users and tasks.

User indexes:

- `email` unique index for login and registration conflict checks.

Task indexes:

- `{ user: 1, createdAt: -1 }` for the default task history view.
- `{ user: 1, status: 1, createdAt: -1 }` for filtered dashboard views.
- `{ status: 1, createdAt: 1 }` for operational sweeps and future cleanup jobs.
- `{ operation: 1, createdAt: -1 }` for analytics by task type.

The API does not return full `inputText` in list responses, which keeps dashboard queries light. Full input, logs, and result are loaded only on the task detail endpoint.

For larger retention windows, add TTL or scheduled archival for completed tasks and consider moving verbose logs to object storage or a log pipeline.

## 5. Redis Failure Handling

Redis is required to enqueue and process new jobs. The backend handles publish failures explicitly:

- It creates the MongoDB task first.
- If Redis publish fails, it marks the task `failed`, appends a log entry, and returns `503`.
- The user can retry the failed task after Redis recovers.

Worker-side Redis failures stop message intake but do not corrupt completed MongoDB records. Redis is configured with append-only persistence in Docker Compose and Kubernetes manifests.

Recommended production improvements:

- Use a managed Redis service or Redis Sentinel/Cluster.
- Alert on stream length, Redis memory, rejected connections, and AOF persistence errors.
- Add a small reconciliation job that finds old `pending` tasks without stream messages and republishes them after a Redis outage.
- Use dead-letter stream monitoring for recurring task failures.

## 6. Security Design

- Passwords are hashed with bcrypt before storage.
- JWTs are signed with a secret supplied from environment or Kubernetes Secret.
- Helmet sets common HTTP security headers.
- API rate limiting reduces brute-force and noisy-client risk.
- CORS is restricted through `FRONTEND_ORIGIN`.
- Docker images run as non-root users.
- Kubernetes workloads use restricted security contexts where practical.
- Real secrets are not committed. GitOps uses External Secrets, with a local Secret template provided for demo clusters.

## 7. Staging and Production Deployment

The infrastructure repository contains a Kustomize base and two overlays:

- `overlays/staging`
- `overlays/production`

Both overlays reuse the same base but set separate namespaces, hostnames, image tags, replica counts, and rate limits. Argo CD applications point to these overlays and enable auto-sync with prune and self-heal.

Deployment flow:

1. Developer merges application changes to `main`.
2. CI runs lint/tests and builds Docker images.
3. CI pushes images tagged with `sha-<commit>`.
4. CI updates the staging overlay image tags in the infra repository.
5. Argo CD detects the infra repo change and auto-syncs staging.
6. A version tag such as `v1.0.0` updates the production overlay.
7. Argo CD auto-syncs production from the production overlay.

For stricter production controls, switch production Argo CD sync to manual approval while keeping staging fully automatic.

## 8. Observability and Operations

The backend uses structured Pino logs. The worker writes structured process logs and task-level logs into MongoDB. Kubernetes probes cover frontend, backend, worker, Redis, and MongoDB.

Recommended additions for a live cluster:

- Prometheus and Grafana dashboards for API latency, Redis stream lag, worker throughput, and MongoDB write latency.
- Centralized log collection with Loki, OpenSearch, or a cloud logging backend.
- Alerts for failed task rate, queue age, Redis availability, MongoDB primary health, and Argo CD sync failures.
