# Fitness Platform Backend — Architecture Guide

## Overview

Production-ready GraphQL backend for an AI-powered fitness platform built with **Node.js**, **TypeScript**, **Apollo Server v4**, **MongoDB**, and **Redis**.

## Architecture Pattern

```
GraphQL Layer (Resolvers, Directives, Loaders, Subscriptions)
        ↓
Service Layer (Business Logic)
        ↓
Repository Layer (Data Access)
        ↓
MongoDB / Redis
```

**Rule:** Resolvers never contain business logic — they delegate to services.

## Directory Structure

| Path | Purpose |
|------|---------|
| `src/modules/` | Domain services (auth, users, workouts, AI, etc.) |
| `src/graphql/` | Schema, resolvers, loaders, directives, subscriptions |
| `src/repositories/` | MongoDB data access |
| `src/models/` | Mongoose schemas |
| `src/cache/` | Redis caching + Pub/Sub |
| `src/middleware/` | Auth, security, GraphQL plugins |
| `src/validation/` | Zod schemas |
| `src/errors/` | Typed error hierarchy |
| `src/logger/` | Winston centralized logging |

## DataLoader — N+1 Prevention

### Before (N+1 Problem)

```graphql
query {
  getUsers {          # 1 query → 100 users
    workouts {        # 100 additional queries (1 per user)
      workoutName
    }
  }
}
# Total: 101 database queries
```

### After (With DataLoader)

```graphql
query {
  getUsers {
    workouts {
      workoutName
    }
  }
}
# Total: 2 database queries
# 1. Fetch all users
# 2. Batch fetch workouts: Workout.find({ userId: { $in: [...] } })
```

Loaders implemented in `src/graphql/loaders/index.ts`:
- `userLoader` — batch user lookups
- `workoutsByUserLoader` — batch workouts by userId
- `progressByUserLoader` — batch progress logs
- `notificationsByUserLoader` — batch notifications

## GraphQL Features

- **Object Types:** User, Workout, NutritionPlan, etc.
- **Input Types:** RegisterInput, CreateWorkoutInput, etc.
- **Enums:** UserRole, WorkoutType, Difficulty, FitnessGoal
- **Interfaces:** Node (shared `id` field)
- **Unions:** SearchResult = User | Workout | NutritionPlan
- **Custom Scalars:** DateTime, JSON
- **Directives:** `@auth(role: ADMIN)`

## Subscriptions

WebSocket subscriptions via `graphql-ws` + Redis Pub/Sub:
- `workoutCompleted`
- `progressUpdated`
- `notificationReceived`

## Interview Discussion Points

1. **Why Resolver → Service → Repository?** Separation of concerns, testability, reusability
2. **Why DataLoader?** Solves N+1 in GraphQL field resolvers with per-request batching
3. **Why Redis Pub/Sub for subscriptions?** Enables horizontal scaling across multiple server instances
4. **Why Zod over class-validator?** Runtime type inference, composable schemas, excellent TS integration
5. **Why persisted queries?** Reduces payload size, enables query allowlisting in production
