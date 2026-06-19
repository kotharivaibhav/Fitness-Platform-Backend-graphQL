import { Types } from 'mongoose';
import { WorkoutSessionModel, IWorkoutSession } from '../models/WorkoutSession';

export class WorkoutSessionRepository {
  async create(data: Partial<IWorkoutSession>): Promise<IWorkoutSession> {
    return WorkoutSessionModel.create(data);
  }

  async findByUserId(userId: string, limit = 50): Promise<IWorkoutSession[]> {
    return WorkoutSessionModel.find({ userId }).sort({ completedAt: -1 }).limit(limit);
  }

  async countByUserIdInPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    return WorkoutSessionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      completedAt: { $gte: startDate, $lte: endDate },
    });
  }

  async aggregateCaloriesBurned(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await WorkoutSessionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          completedAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$caloriesBurned' } } },
    ]);
    return result[0]?.total ?? 0;
  }
}

export const workoutSessionRepository = new WorkoutSessionRepository();
