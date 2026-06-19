import { progressLogRepository } from '../../repositories/progressLog.repository';
import { workoutSessionRepository } from '../../repositories/workoutSession.repository';
import { cacheService } from '../../cache/cache.service';
import { ForbiddenError } from '../../errors';
import { getWeekStart, getMonthStart } from '../../utils/helpers';
import { JwtPayload } from '../../utils/jwt';

export interface AnalyticsResult {
  weeklyProgress: Array<{
    week: string;
    avgWeight: number | null;
    totalWater: number;
    totalCalories: number;
    logCount: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    avgWeight: number | null;
    avgBodyFat: number | null;
    totalWater: number;
    totalCalories: number;
  }>;
  caloriesBurned: number;
  weightChange: number | null;
  workoutConsistency: {
    weeklyWorkouts: number;
    monthlyWorkouts: number;
    consistencyScore: number;
  };
}

export class AnalyticsService {
  async getAnalytics(userId: string, requester: JwtPayload): Promise<AnalyticsResult> {
    if (userId !== requester.userId && requester.role !== 'ADMIN') {
      throw new ForbiddenError('Cannot access analytics');
    }

    const cached = await cacheService.getAnalytics<AnalyticsResult>(userId, 'full');
    if (cached) return cached;

    const weekStart = getWeekStart();
    const monthStart = getMonthStart();
    const now = new Date();

    const [weeklyRaw, monthlyRaw, caloriesBurned, weeklyWorkouts, monthlyWorkouts, progressLogs] =
      await Promise.all([
        progressLogRepository.aggregateWeeklyProgress(userId, monthStart),
        progressLogRepository.aggregateMonthlyProgress(userId, new Date(now.getFullYear(), 0, 1)),
        workoutSessionRepository.aggregateCaloriesBurned(userId, monthStart, now),
        workoutSessionRepository.countByUserIdInPeriod(userId, weekStart, now),
        workoutSessionRepository.countByUserIdInPeriod(userId, monthStart, now),
        progressLogRepository.findInPeriod(userId, monthStart, now),
      ]);

    const weeklyProgress = (weeklyRaw as Array<Record<string, unknown>>).map((w) => ({
      week: w._id as string,
      avgWeight: (w.avgWeight as number) ?? null,
      totalWater: (w.totalWater as number) ?? 0,
      totalCalories: (w.totalCalories as number) ?? 0,
      logCount: (w.logCount as number) ?? 0,
    }));

    const monthlyProgress = (monthlyRaw as Array<Record<string, unknown>>).map((m) => ({
      month: m._id as string,
      avgWeight: (m.avgWeight as number) ?? null,
      avgBodyFat: (m.avgBodyFat as number) ?? null,
      totalWater: (m.totalWater as number) ?? 0,
      totalCalories: (m.totalCalories as number) ?? 0,
    }));

    const weightLogs = progressLogs.filter((l) => l.weight != null);
    const weightChange =
      weightLogs.length >= 2
        ? (weightLogs[weightLogs.length - 1].weight ?? 0) - (weightLogs[0].weight ?? 0)
        : null;

    const expectedWeeklyWorkouts = 4;
    const consistencyScore = Math.min(
      100,
      Math.round((weeklyWorkouts / expectedWeeklyWorkouts) * 100),
    );

    const result: AnalyticsResult = {
      weeklyProgress,
      monthlyProgress,
      caloriesBurned,
      weightChange,
      workoutConsistency: {
        weeklyWorkouts,
        monthlyWorkouts,
        consistencyScore,
      },
    };

    await cacheService.setAnalytics(userId, 'full', result);
    return result;
  }
}

export const analyticsService = new AnalyticsService();
