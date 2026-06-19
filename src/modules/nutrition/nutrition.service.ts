import { nutritionPlanRepository } from '../../repositories/nutritionPlan.repository';
import { ForbiddenError, NotFoundError } from '../../errors';
import { INutritionPlan } from '../../models/NutritionPlan';
import { JwtPayload } from '../../utils/jwt';

export class NutritionService {
  async getNutritionPlan(userId: string, requester: JwtPayload): Promise<INutritionPlan> {
    if (userId !== requester.userId && requester.role !== 'ADMIN') {
      throw new ForbiddenError('Cannot access nutrition plan');
    }

    const plan = await nutritionPlanRepository.findLatestByUserId(userId);
    if (!plan) throw new NotFoundError('Nutrition plan');
    return plan;
  }
}

export const nutritionService = new NutritionService();
