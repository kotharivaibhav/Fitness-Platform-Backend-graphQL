import { setupTestDatabase, teardownTestDatabase, clearDatabase } from '../helpers/database';
import { createTestUser } from '../helpers/auth';
import { createLoaders } from '../../src/graphql/loaders';
import { userRepository } from '../../src/repositories/user.repository';
import { workoutRepository } from '../../src/repositories/workout.repository';
import { progressLogRepository } from '../../src/repositories/progressLog.repository';
import { notificationRepository } from '../../src/repositories/notification.repository';
import { Types } from 'mongoose';

describe('DataLoader batching', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('batches user lookups into single query (N+1 prevention)', async () => {
    const user1 = await createTestUser({ email: 'user1@test.com' });
    const user2 = await createTestUser({ email: 'user2@test.com' });

    const findByIdsSpy = jest.spyOn(userRepository, 'findByIds');

    const loaders = createLoaders();
    const [u1, u2] = await Promise.all([
      loaders.userLoader.load(user1.user._id.toString()),
      loaders.userLoader.load(user2.user._id.toString()),
    ]);

    expect(u1?.email).toBe('user1@test.com');
    expect(u2?.email).toBe('user2@test.com');
    expect(findByIdsSpy).toHaveBeenCalledTimes(1);
    expect(findByIdsSpy.mock.calls[0][0]).toHaveLength(2);

    findByIdsSpy.mockRestore();
  });

  it('batches workouts by user into single query', async () => {
    const { user } = await createTestUser();
    const userId = user._id.toString();

    await workoutRepository.create({
      userId: user._id,
      workoutName: 'Workout 1',
      workoutType: 'STRENGTH',
      difficulty: 'BEGINNER',
      exercises: [{ name: 'Squat', sets: 3, reps: 10 }],
      duration: 30,
      caloriesBurn: 200,
    });

    const findByUserIdsSpy = jest.spyOn(workoutRepository, 'findByUserIds');

    const loaders = createLoaders();
    await loaders.workoutsByUserLoader.load(userId);
    await loaders.workoutsByUserLoader.load(userId);

    expect(findByUserIdsSpy).toHaveBeenCalledTimes(1);

    findByUserIdsSpy.mockRestore();
  });

  it('batches progress logs by user', async () => {
    const { user } = await createTestUser();
    const userId = user._id.toString();

    await progressLogRepository.create({
      userId: user._id,
      weight: 75,
      loggedAt: new Date(),
    });

    const findByUserIdsSpy = jest.spyOn(progressLogRepository, 'findByUserIds');

    const loaders = createLoaders();
    const logs = await loaders.progressByUserLoader.load(userId);

    expect(logs).toHaveLength(1);
    expect(findByUserIdsSpy).toHaveBeenCalledTimes(1);

    findByUserIdsSpy.mockRestore();
  });

  it('batches notifications by user', async () => {
    const { user } = await createTestUser();
    const userId = user._id.toString();

    await notificationRepository.create({
      userId: new Types.ObjectId(userId),
      title: 'Test',
      message: 'Hello',
      isRead: false,
    });

    const findByUserIdsSpy = jest.spyOn(notificationRepository, 'findByUserIds');

    const loaders = createLoaders();
    const notifications = await loaders.notificationsByUserLoader.load(userId);

    expect(notifications).toHaveLength(1);
    expect(findByUserIdsSpy).toHaveBeenCalledTimes(1);

    findByUserIdsSpy.mockRestore();
  });
});
