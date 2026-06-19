import { z } from 'zod';

export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
export const ActivityLevelEnum = z.enum([
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'ACTIVE',
  'VERY_ACTIVE',
]);
export const GoalEnum = z.enum([
  'WEIGHT_LOSS',
  'MUSCLE_GAIN',
  'STRENGTH',
  'ENDURANCE',
  'MAINTENANCE',
]);
export const RoleEnum = z.enum(['USER', 'TRAINER', 'ADMIN']);
export const WorkoutTypeEnum = z.enum(['STRENGTH', 'CARDIO', 'HIIT', 'FLEXIBILITY', 'MIXED']);
export const DifficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  age: z.number().int().min(13).max(120).optional(),
  gender: GenderEnum.optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  targetWeight: z.number().positive().optional(),
  activityLevel: ActivityLevelEnum.optional(),
  goal: GoalEnum.optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: GenderEnum.optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  targetWeight: z.number().positive().optional(),
  activityLevel: ActivityLevelEnum.optional(),
  goal: GoalEnum.optional(),
});

export const exerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative().optional(),
  duration: z.number().int().positive().optional(),
  restSeconds: z.number().int().nonnegative().optional(),
});

export const createWorkoutSchema = z.object({
  workoutName: z.string().min(1).max(100),
  workoutType: WorkoutTypeEnum,
  difficulty: DifficultyEnum,
  exercises: z.array(exerciseSchema).min(1),
  duration: z.number().int().positive(),
  caloriesBurn: z.number().nonnegative(),
});

export const updateWorkoutSchema = createWorkoutSchema.partial();

export const generateWorkoutPlanSchema = z.object({
  experienceLevel: DifficultyEnum,
});

export const generateNutritionPlanSchema = z.object({
  dailyCalorieTarget: z.number().int().positive().optional(),
});

export const progressLogSchema = z.object({
  weight: z.number().positive().optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  waterIntake: z.number().nonnegative().optional(),
  caloriesConsumed: z.number().nonnegative().optional(),
});

export const markWorkoutCompletedSchema = z.object({
  workoutId: z.string().min(1),
  completedExercises: z.array(z.string()).min(1),
  caloriesBurned: z.number().nonnegative(),
  duration: z.number().int().positive(),
});

import { ValidationError } from '../errors';

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.flatten());
  }
  return result.data;
}
