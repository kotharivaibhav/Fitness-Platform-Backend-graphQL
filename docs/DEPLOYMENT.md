# Production Deployment Guide

## Prerequisites

- Node.js 20 LTS
- MongoDB 7+
- Redis 7+
- Docker & Docker Compose (recommended)

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with production secrets (min 32 chars for JWT secrets)

docker compose up -d
```

Services:
- API: `http://localhost:4000/graphql`
- Swagger: `http://localhost:4000/api-docs`
- Health: `http://localhost:4000/health`

## Manual Deployment

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | Min 32 characters |
| `JWT_REFRESH_SECRET` | Yes | Min 32 characters |
| `CSRF_SECRET` | Yes | Min 16 characters |
| `REDIS_HOST` | Yes | Redis hostname |
| `CORS_ORIGIN` | Yes | Allowed frontend origin |

## Production Checklist

- [ ] Set strong JWT secrets (use `openssl rand -hex 32`)
- [ ] Enable MongoDB authentication
- [ ] Enable Redis password (`REDIS_PASSWORD`)
- [ ] Configure reverse proxy (nginx) with TLS
- [ ] Set `NODE_ENV=production`
- [ ] Configure log aggregation (ELK, Datadog)
- [ ] Set up MongoDB backups
- [ ] Configure Redis persistence (AOF)
- [ ] Enable persisted queries on client
- [ ] Set up health check monitoring on `/health`
- [ ] Configure horizontal scaling with Redis Pub/Sub

## Scaling Considerations

1. **Stateless API servers** — scale horizontally behind load balancer
2. **Redis Pub/Sub** — subscriptions work across multiple instances
3. **MongoDB replica set** — read scaling + failover
4. **DataLoader** — per-request, no cross-request state
5. **Cache TTLs** — tune based on read/write ratio

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):
1. Lint + format check
2. Build TypeScript
3. Run tests with 80% coverage threshold
4. Build Docker image on main branch

## Monitoring

Winston logs to:
- `logs/combined.log` — all logs
- `logs/error.log` — errors only

Recommended: ship logs to centralized logging in production.
