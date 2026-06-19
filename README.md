# AI Fitness Platform Backend

Production-ready GraphQL backend for an AI-powered fitness workout platform.

## Tech Stack

- **Node.js 20 LTS** + **TypeScript**
- **Apollo Server v4** + **GraphQL** + **graphql-ws** subscriptions
- **MongoDB** (Mongoose) + **Redis** (ioredis)
- **JWT** authentication with refresh token rotation
- **DataLoader** for N+1 prevention
- **Winston** logging + **Zod** validation
- **Docker** + **GitHub Actions CI/CD**
- **Jest** + **Supertest** (>80% coverage)

## Features

- User registration/login with RBAC (USER, TRAINER, ADMIN)
- AI-generated workout & nutrition plans
- Workout tracking & completion
- Progress logging (weight, water, calories)
- Real-time subscriptions (workout completed, progress updated, notifications)
- Analytics with MongoDB aggregation pipelines
- Full security stack (depth limiting, complexity analysis, rate limiting, CSRF, Helmet)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start with Docker (MongoDB + Redis + API)
docker compose up -d

# Or run locally (requires MongoDB + Redis)
npm run dev
```

Endpoints:
- GraphQL: `http://localhost:4000/graphql`
- WebSocket: `ws://localhost:4000/graphql`
- Swagger: `http://localhost:4000/api-docs`
- Health: `http://localhost:4000/health`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm test` | Run tests with coverage |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

## Architecture

```
Resolver → Service → Repository → MongoDB/Redis
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture guide.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for all security implementations.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guide.

## Example GraphQL Operations

### Register

```graphql
mutation {
  register(input: {
    firstName: "John"
    lastName: "Doe"
    email: "john@example.com"
    password: "password123"
    goal: MUSCLE_GAIN
    activityLevel: MODERATE
  }) {
    user { id email }
    accessToken
    refreshToken
  }
}
```

### Generate AI Workout Plan

```graphql
mutation {
  generateWorkoutPlan(input: { experienceLevel: INTERMEDIATE }) {
    workoutName
    exercises { name sets reps }
    caloriesBurn
  }
}
```

### Analytics

```graphql
query {
  analytics(userId: "USER_ID") {
    caloriesBurned
    weightChange
    workoutConsistency { consistencyScore weeklyWorkouts }
    weeklyProgress { week avgWeight totalWater }
  }
}
```

### Subscription

```graphql
subscription {
  workoutCompleted(userId: "USER_ID") {
    session { caloriesBurned duration }
    workout { workoutName }
  }
}
```

## Project Structure

```
src/
├── modules/          # Domain services (auth, users, workouts, ai, etc.)
├── graphql/          # Schema, resolvers, loaders, directives, subscriptions
├── repositories/     # MongoDB data access
├── models/           # Mongoose schemas
├── cache/            # Redis cache + Pub/Sub
├── middleware/       # Auth, security, GraphQL plugins
├── config/           # Environment, database, redis
├── validation/       # Zod schemas
├── errors/           # Typed error hierarchy
├── logger/           # Winston logger
└── utils/            # JWT, password, helpers
```

## License

MIT
