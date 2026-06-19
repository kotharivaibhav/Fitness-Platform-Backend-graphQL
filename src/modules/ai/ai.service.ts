import { Types } from 'mongoose';
import { IUser } from '../../models/User';
import { IExercise } from '../../models/Workout';
import { workoutRepository } from '../../repositories/workout.repository';
import { nutritionPlanRepository } from '../../repositories/nutritionPlan.repository';
import { cacheService } from '../../cache/cache.service';
import {
  validateInput,
  generateWorkoutPlanSchema,
  generateNutritionPlanSchema,
} from '../../validation/schemas';

interface AIWorkoutPlan {
  workoutName: string;
  workoutType: 'STRENGTH' | 'CARDIO' | 'HIIT' | 'FLEXIBILITY' | 'MIXED';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  exercises: IExercise[];
  duration: number;
  caloriesBurn: number;
}

interface AINutritionPlan {
  meals: Array<{
    name: string;
    time: string;
    foods: string[];
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  }>;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

const WORKOUT_TEMPLATES: Record<string, AIWorkoutPlan[]> = {
  WEIGHT_LOSS: [
    {
      workoutName: 'Fat Burn HIIT Circuit',
      workoutType: 'HIIT',
      difficulty: 'INTERMEDIATE',
      exercises: [
        { name: 'Jumping Jacks', sets: 3, reps: 30, duration: 30, restSeconds: 15 },
        { name: 'Burpees', sets: 3, reps: 15, restSeconds: 30 },
        { name: 'Mountain Climbers', sets: 3, reps: 20, restSeconds: 20 },
        { name: 'High Knees', sets: 3, reps: 30, duration: 30, restSeconds: 15 },
      ],
      duration: 35,
      caloriesBurn: 350,
    },
  ],
  MUSCLE_GAIN: [
    {
      workoutName: 'Hypertrophy Push Day',
      workoutType: 'STRENGTH',
      difficulty: 'INTERMEDIATE',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 10, weight: 60, restSeconds: 90 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 12, weight: 25, restSeconds: 60 },
        { name: 'Shoulder Press', sets: 3, reps: 10, weight: 20, restSeconds: 60 },
        { name: 'Tricep Dips', sets: 3, reps: 12, restSeconds: 45 },
      ],
      duration: 55,
      caloriesBurn: 280,
    },
  ],
  STRENGTH: [
    {
      workoutName: 'Powerlifting Foundation',
      workoutType: 'STRENGTH',
      difficulty: 'ADVANCED',
      exercises: [
        { name: 'Squat', sets: 5, reps: 5, weight: 100, restSeconds: 180 },
        { name: 'Deadlift', sets: 5, reps: 5, weight: 120, restSeconds: 180 },
        { name: 'Overhead Press', sets: 5, reps: 5, weight: 50, restSeconds: 120 },
      ],
      duration: 60,
      caloriesBurn: 320,
    },
  ],
  ENDURANCE: [
    {
      workoutName: 'Cardio Endurance Builder',
      workoutType: 'CARDIO',
      difficulty: 'INTERMEDIATE',
      exercises: [
        { name: 'Treadmill Run', sets: 1, reps: 1, duration: 1800, restSeconds: 0 },
        { name: 'Cycling', sets: 1, reps: 1, duration: 900, restSeconds: 0 },
        { name: 'Rowing', sets: 3, reps: 500, duration: 120, restSeconds: 60 },
      ],
      duration: 50,
      caloriesBurn: 450,
    },
  ],
  MAINTENANCE: [
    {
      workoutName: 'Full Body Maintenance',
      workoutType: 'MIXED',
      difficulty: 'BEGINNER',
      exercises: [
        { name: 'Bodyweight Squats', sets: 3, reps: 15, restSeconds: 45 },
        { name: 'Push-ups', sets: 3, reps: 12, restSeconds: 45 },
        { name: 'Plank', sets: 3, reps: 1, duration: 45, restSeconds: 30 },
        { name: 'Walking Lunges', sets: 3, reps: 12, restSeconds: 45 },
      ],
      duration: 30,
      caloriesBurn: 200,
    },
  ],
};

export class AIService {
  generateWorkoutPlan(user: IUser, experienceLevel: string): AIWorkoutPlan {
    const goal = user.goal ?? 'MAINTENANCE';
    const templates = WORKOUT_TEMPLATES[goal] ?? WORKOUT_TEMPLATES.MAINTENANCE;
    const template = { ...templates[0] };

    template.difficulty = experienceLevel as AIWorkoutPlan['difficulty'];

    const weightFactor = user.weight ? user.weight / 70 : 1;
    template.caloriesBurn = Math.round(template.caloriesBurn * weightFactor);

    if (experienceLevel === 'BEGINNER') {
      template.exercises = template.exercises.map((e) => ({
        ...e,
        sets: Math.max(2, e.sets - 1),
        reps: Math.max(8, e.reps - 2),
      }));
    } else if (experienceLevel === 'ADVANCED') {
      template.exercises = template.exercises.map((e) => ({
        ...e,
        sets: e.sets + 1,
      }));
    }

    return template;
  }

  generateNutritionPlan(user: IUser, dailyCalorieTarget?: number): AINutritionPlan {
    const weight = user.weight ?? 70;
    const height = user.height ?? 170;
    const age = user.age ?? 30;
    const isMale = user.gender === 'MALE';

    const bmr = isMale
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityMultipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.9,
    };

    const tdee = bmr * (activityMultipliers[user.activityLevel ?? 'MODERATE'] ?? 1.55);
    let calories = dailyCalorieTarget ?? Math.round(tdee);

    if (user.goal === 'WEIGHT_LOSS') calories = Math.round(calories * 0.85);
    if (user.goal === 'MUSCLE_GAIN') calories = Math.round(calories * 1.1);

    const proteins = Math.round(weight * 2);
    const fats = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - proteins * 4 - fats * 9) / 4);

    return {
      meals: [
        {
          name: 'Breakfast',
          time: '08:00',
          foods: ['Oatmeal with berries', 'Greek yogurt', 'Almonds'],
          calories: Math.round(calories * 0.25),
          proteins: Math.round(proteins * 0.25),
          carbs: Math.round(carbs * 0.3),
          fats: Math.round(fats * 0.2),
        },
        {
          name: 'Lunch',
          time: '12:30',
          foods: ['Grilled chicken breast', 'Brown rice', 'Steamed vegetables'],
          calories: Math.round(calories * 0.35),
          proteins: Math.round(proteins * 0.4),
          carbs: Math.round(carbs * 0.35),
          fats: Math.round(fats * 0.35),
        },
        {
          name: 'Snack',
          time: '16:00',
          foods: ['Protein shake', 'Banana', 'Peanut butter'],
          calories: Math.round(calories * 0.15),
          proteins: Math.round(proteins * 0.2),
          carbs: Math.round(carbs * 0.15),
          fats: Math.round(fats * 0.25),
        },
        {
          name: 'Dinner',
          time: '19:00',
          foods: ['Salmon fillet', 'Sweet potato', 'Mixed salad'],
          calories: Math.round(calories * 0.25),
          proteins: Math.round(proteins * 0.15),
          carbs: Math.round(carbs * 0.2),
          fats: Math.round(fats * 0.2),
        },
      ],
      calories,
      proteins,
      carbs,
      fats,
    };
  }

  async generateAndStoreWorkoutPlan(userId: string, input: unknown) {
    const { experienceLevel } = validateInput(generateWorkoutPlanSchema, input);
    const { userService } = await import('../users/user.service');
    const user = await userService.getUser(userId);

    const plan = this.generateWorkoutPlan(user, experienceLevel);
    const workout = await workoutRepository.create({
      userId: new Types.ObjectId(userId),
      ...plan,
    });

    await cacheService.invalidateWorkout(workout._id.toString(), userId);
    return workout;
  }

  async generateAndStoreNutritionPlan(userId: string, input: unknown) {
    const data = validateInput(generateNutritionPlanSchema, input);
    const { userService } = await import('../users/user.service');
    const user = await userService.getUser(userId);

    const plan = this.generateNutritionPlan(user, data.dailyCalorieTarget);
    return nutritionPlanRepository.create({
      userId: new Types.ObjectId(userId),
      ...plan,
    });
  }
}

export const aiService = new AIService();
