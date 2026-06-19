import { Types } from 'mongoose';
import { workoutRepository } from '../../repositories/workout.repository';
import { workoutSessionRepository } from '../../repositories/workoutSession.repository';
import { notificationRepository } from '../../repositories/notification.repository';
import { cacheService } from '../../cache/cache.service';
import { pubSubService, SUBSCRIPTION_CHANNELS } from '../../cache/pubsub.service';
import { NotFoundError, ForbiddenError } from '../../errors';
import {
  validateInput,
  createWorkoutSchema,
  updateWorkoutSchema,
  markWorkoutCompletedSchema,
} from '../../validation/schemas';
import { IWorkout } from '../../models/Workout';
import { JwtPayload, UserRole } from '../../utils/jwt';

export class WorkoutService {
  async getWorkout(id: string, requester: JwtPayload): Promise<IWorkout> {
    const cached = await cacheService.getWorkout<IWorkout>(id);
    const workout = cached ?? (await workoutRepository.findById(id));
    if (!workout) throw new NotFoundError('Workout');

    if (workout.userId.toString() !== requester.userId && requester.role !== 'ADMIN') {
      throw new ForbiddenError('Cannot access this workout');
    }

    if (!cached) await cacheService.setWorkout(id, workout.toObject());
    return workout;
  }

  async getWorkouts(userId: string, requester: JwtPayload): Promise<IWorkout[]> {
    if (userId !== requester.userId && requester.role !== 'ADMIN') {
      throw new ForbiddenError('Cannot access these workouts');
    }
    return workoutRepository.findByUserId(userId);
  }

  async createWorkout(userId: string, input: unknown): Promise<IWorkout> {
    const data = validateInput(createWorkoutSchema, input);
    const workout = await workoutRepository.create({
      ...data,
      userId: new Types.ObjectId(userId),
    });
    await cacheService.invalidateWorkout(workout._id.toString(), userId);
    return workout;
  }

  async updateWorkout(id: string, userId: string, input: unknown): Promise<IWorkout> {
    const workout = await this.getWorkout(id, { userId, email: '', role: UserRole.USER });
    if (workout.userId.toString() !== userId) {
      throw new ForbiddenError('Cannot update this workout');
    }

    const data = validateInput(updateWorkoutSchema, input);
    const updated = await workoutRepository.update(id, data);
    if (!updated) throw new NotFoundError('Workout');

    await cacheService.invalidateWorkout(id, userId);
    return updated;
  }

  async deleteWorkout(id: string, userId: string): Promise<boolean> {
    const workout = await this.getWorkout(id, { userId, email: '', role: UserRole.USER });
    if (workout.userId.toString() !== userId) {
      throw new ForbiddenError('Cannot delete this workout');
    }

    await workoutRepository.delete(id);
    await cacheService.invalidateWorkout(id, userId);
    return true;
  }

  async markWorkoutCompleted(
    userId: string,
    input: unknown,
  ): Promise<{
    session: Awaited<ReturnType<typeof workoutSessionRepository.create>>;
    workout: IWorkout;
  }> {
    const data = validateInput(markWorkoutCompletedSchema, input);
    const workout = await workoutRepository.findById(data.workoutId);
    if (!workout) throw new NotFoundError('Workout');

    if (workout.userId.toString() !== userId) {
      throw new ForbiddenError('Cannot complete this workout');
    }

    const session = await workoutSessionRepository.create({
      userId: new Types.ObjectId(userId),
      workoutId: workout._id,
      completedExercises: data.completedExercises,
      caloriesBurned: data.caloriesBurned,
      duration: data.duration,
      completedAt: new Date(),
    });

    const notification = await notificationRepository.create({
      userId: new Types.ObjectId(userId),
      title: 'Workout Completed!',
      message: `Great job completing "${workout.workoutName}"! You burned ${data.caloriesBurned} calories.`,
      isRead: false,
    });

    const payload = {
      workoutCompleted: {
        session: session.toObject(),
        workout: workout.toObject(),
        userId,
      },
      notificationReceived: {
        notification: notification.toObject(),
        userId,
      },
    };

    await pubSubService.publish(SUBSCRIPTION_CHANNELS.WORKOUT_COMPLETED, payload.workoutCompleted);
    await pubSubService.publish(
      SUBSCRIPTION_CHANNELS.NOTIFICATION_RECEIVED,
      payload.notificationReceived,
    );

    await cacheService.invalidateUser(userId);

    return { session, workout };
  }
}

export const workoutService = new WorkoutService();
