import request from 'supertest';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { setupTestDatabase, teardownTestDatabase, clearDatabase } from '../helpers/database';
import { createTestUser } from '../helpers/auth';
import { schema } from '../../src/graphql';
import { createContext } from '../../src/graphql/context';
import {
  depthLimitValidationRule,
  createComplexityPlugin,
  apolloErrorFormatter,
} from '../../src/middleware/graphql.security';
import { workoutRepository } from '../../src/repositories/workout.repository';
import { authMiddleware } from '../../src/middleware/auth.middleware';

describe('GraphQL Integration', () => {
  let app: express.Application;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    app = express();
    app.use(express.json());
    app.use(authMiddleware);

    const apolloServer = new ApolloServer({
      schema,
      validationRules: [depthLimitValidationRule],
      plugins: [createComplexityPlugin()],
      formatError: apolloErrorFormatter,
    });
    await apolloServer.start();

    app.use(
      '/graphql',
      expressMiddleware(apolloServer, {
        context: async ({ req }) => createContext(req),
      }),
    );
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const result = await createTestUser();
    accessToken = result.accessToken;
    userId = result.user._id.toString();
  });

  const graphqlRequest = (query: string, variables?: Record<string, unknown>) =>
    request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ query, variables });

  it('returns current user via me query', async () => {
    const response = await graphqlRequest(`
      query {
        me {
          id
          email
          firstName
        }
      }
    `);

    expect(response.status).toBe(200);
    expect(response.body.data.me.email).toContain('@example.com');
    expect(response.body.data.me.id).toBe(userId);
  });

  it('generates AI workout plan', async () => {
    const response = await graphqlRequest(
      `
        mutation GeneratePlan($input: GenerateWorkoutPlanInput!) {
          generateWorkoutPlan(input: $input) {
            id
            workoutName
            exercises { name sets reps }
          }
        }
      `,
      { input: { experienceLevel: 'INTERMEDIATE' } },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.generateWorkoutPlan.workoutName).toBeDefined();
    expect(response.body.data.generateWorkoutPlan.exercises.length).toBeGreaterThan(0);
  });

  it('adds progress log', async () => {
    const response = await graphqlRequest(
      `
        mutation AddLog($input: ProgressLogInput!) {
          addProgressLog(input: $input) {
            id
            weight
            waterIntake
          }
        }
      `,
      { input: { weight: 74.5, waterIntake: 2500 } },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.addProgressLog.weight).toBe(74.5);
    expect(response.body.data.addProgressLog.waterIntake).toBe(2500);
  });

  it('returns analytics data', async () => {
    await graphqlRequest(
      `mutation($input: ProgressLogInput!) { addProgressLog(input: $input) { id } }`,
      { input: { weight: 75, caloriesConsumed: 2000 } },
    );

    const response = await graphqlRequest(
      `
      query($userId: ID!) {
        analytics(userId: $userId) {
          caloriesBurned
          weightChange
          workoutConsistency { consistencyScore }
        }
      }
    `,
      { userId },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.analytics).toBeDefined();
    expect(response.body.data.analytics.workoutConsistency.consistencyScore).toBeGreaterThanOrEqual(
      0,
    );
  });

  it('requires auth for protected queries', async () => {
    const response = await request(app).post('/graphql').send({ query: '{ me { id } }' });

    expect(response.status).toBe(200);
    expect(response.body.errors[0].extensions.code).toBe('AUTH_ERROR');
  });

  it('loads user workouts via DataLoader without N+1', async () => {
    await graphqlRequest(
      `mutation($input: GenerateWorkoutPlanInput!) { generateWorkoutPlan(input: $input) { id } }`,
      { input: { experienceLevel: 'BEGINNER' } },
    );

    const findByUserIdsSpy = jest.spyOn(workoutRepository, 'findByUserIds');

    const response = await graphqlRequest(
      `
      query($userId: ID!) {
        getUser(id: $userId) {
          id
          workouts { id workoutName }
        }
      }
    `,
      { userId },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.getUser.workouts.length).toBeGreaterThan(0);
    expect(findByUserIdsSpy).toHaveBeenCalledTimes(1);

    findByUserIdsSpy.mockRestore();
  });
});
