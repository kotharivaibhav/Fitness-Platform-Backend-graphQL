import { Types } from 'mongoose';
import { ProgressLogModel, IProgressLog } from '../models/ProgressLog';

export class ProgressLogRepository {
  async create(data: Partial<IProgressLog>): Promise<IProgressLog> {
    return ProgressLogModel.create(data);
  }

  async findByUserId(userId: string, limit = 100): Promise<IProgressLog[]> {
    return ProgressLogModel.find({ userId }).sort({ loggedAt: -1 }).limit(limit);
  }

  async findByUserIds(userIds: string[]): Promise<IProgressLog[]> {
    return ProgressLogModel.find({ userId: { $in: userIds } }).sort({ loggedAt: -1 });
  }

  async findInPeriod(userId: string, startDate: Date, endDate: Date): Promise<IProgressLog[]> {
    return ProgressLogModel.find({
      userId: new Types.ObjectId(userId),
      loggedAt: { $gte: startDate, $lte: endDate },
    }).sort({ loggedAt: 1 });
  }

  async aggregateWeeklyProgress(userId: string, startDate: Date): Promise<unknown[]> {
    return ProgressLogModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), loggedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%G-%V', date: '$loggedAt' } },
          avgWeight: { $avg: '$weight' },
          totalWater: { $sum: '$waterIntake' },
          totalCalories: { $sum: '$caloriesConsumed' },
          logCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async aggregateMonthlyProgress(userId: string, startDate: Date): Promise<unknown[]> {
    return ProgressLogModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), loggedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$loggedAt' } },
          avgWeight: { $avg: '$weight' },
          avgBodyFat: { $avg: '$bodyFat' },
          totalWater: { $sum: '$waterIntake' },
          totalCalories: { $sum: '$caloriesConsumed' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}

export const progressLogRepository = new ProgressLogRepository();
