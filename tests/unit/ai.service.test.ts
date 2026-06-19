import { aiService } from '../../src/modules/ai/ai.service';
import { IUser } from '../../src/models/User';
import { UserRole } from '../../src/utils/jwt';
import { Types } from 'mongoose';

describe('AIService', () => {
  const mockUser: IUser = {
    _id: new Types.ObjectId(),
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'hash',
    role: UserRole.USER,
    age: 30,
    gender: 'MALE',
    height: 180,
    weight: 80,
    goal: 'WEIGHT_LOSS',
    activityLevel: 'MODERATE',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IUser;

  it('generates workout plan based on user goal', () => {
    const plan = aiService.generateWorkoutPlan(mockUser, 'INTERMEDIATE');
    expect(plan.workoutName).toBeDefined();
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.difficulty).toBe('INTERMEDIATE');
    expect(plan.caloriesBurn).toBeGreaterThan(0);
  });

  it('adjusts workout for beginner level', () => {
    const beginnerPlan = aiService.generateWorkoutPlan(mockUser, 'BEGINNER');
    const advancedPlan = aiService.generateWorkoutPlan(mockUser, 'ADVANCED');
    expect(beginnerPlan.exercises[0].sets).toBeLessThanOrEqual(advancedPlan.exercises[0].sets);
  });

  it('generates nutrition plan with macro targets', () => {
    const plan = aiService.generateNutritionPlan(mockUser);
    expect(plan.calories).toBeGreaterThan(0);
    expect(plan.proteins).toBeGreaterThan(0);
    expect(plan.meals).toHaveLength(4);
    expect(plan.meals[0].foods.length).toBeGreaterThan(0);
  });

  it('reduces calories for weight loss goal', () => {
    const lossPlan = aiService.generateNutritionPlan({ ...mockUser, goal: 'WEIGHT_LOSS' } as IUser);
    const gainPlan = aiService.generateNutritionPlan({ ...mockUser, goal: 'MUSCLE_GAIN' } as IUser);
    expect(lossPlan.calories).toBeLessThan(gainPlan.calories);
  });
});
