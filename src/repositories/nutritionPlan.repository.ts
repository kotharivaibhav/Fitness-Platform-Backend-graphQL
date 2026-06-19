import { NutritionPlanModel, INutritionPlan } from '../models/NutritionPlan';

export class NutritionPlanRepository {
  async create(data: Partial<INutritionPlan>): Promise<INutritionPlan> {
    return NutritionPlanModel.create(data);
  }

  async findLatestByUserId(userId: string): Promise<INutritionPlan | null> {
    return NutritionPlanModel.findOne({ userId }).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<INutritionPlan | null> {
    return NutritionPlanModel.findById(id);
  }
}

export const nutritionPlanRepository = new NutritionPlanRepository();
