import { setupTestDatabase, teardownTestDatabase, clearDatabase } from '../helpers/database';
import { createTestUser } from '../helpers/auth';
import { workoutService } from '../../src/modules/workouts/workout.service';
import { progressService } from '../../src/modules/progress/progress.service';
import { analyticsService } from '../../src/modules/analytics/analytics.service';
import { JwtPayload, UserRole } from '../../src/utils/jwt';

describe('Workout and Progress Integration', () => {
  let requester: JwtPayload;
  let userId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const { user } = await createTestUser();
    userId = user._id.toString();
    requester = { userId, email: user.email, role: UserRole.USER };
  });

  it('creates, updates, and deletes workout', async () => {
    const workout = await workoutService.createWorkout(userId, {
      workoutName: 'Morning Run',
      workoutType: 'CARDIO',
      difficulty: 'BEGINNER',
      exercises: [{ name: 'Running', sets: 1, reps: 1, duration: 1800 }],
      duration: 30,
      caloriesBurn: 300,
    });

    expect(workout.workoutName).toBe('Morning Run');

    const updated = await workoutService.updateWorkout(workout._id.toString(), userId, {
      workoutName: 'Evening Run',
    });
    expect(updated.workoutName).toBe('Evening Run');

    const deleted = await workoutService.deleteWorkout(workout._id.toString(), userId);
    expect(deleted).toBe(true);
  });

  it('marks workout as completed and creates session', async () => {
    const workout = await workoutService.createWorkout(userId, {
      workoutName: 'HIIT Session',
      workoutType: 'HIIT',
      difficulty: 'INTERMEDIATE',
      exercises: [{ name: 'Burpees', sets: 3, reps: 15 }],
      duration: 25,
      caloriesBurn: 250,
    });

    const { session } = await workoutService.markWorkoutCompleted(userId, {
      workoutId: workout._id.toString(),
      completedExercises: ['Burpees'],
      caloriesBurned: 250,
      duration: 25,
    });

    expect(session.caloriesBurned).toBe(250);
    expect(session.completedExercises).toContain('Burpees');
  });

  it('tracks progress and computes analytics', async () => {
    await progressService.addProgressLog(userId, { weight: 80, waterIntake: 2000 });
    await progressService.addProgressLog(userId, { weight: 79, waterIntake: 2500 });

    const logs = await progressService.getProgress(userId, requester);
    expect(logs).toHaveLength(2);

    const analytics = await analyticsService.getAnalytics(userId, requester);
    expect(analytics.weeklyProgress).toBeDefined();
    expect(analytics.workoutConsistency).toBeDefined();
  });
});
