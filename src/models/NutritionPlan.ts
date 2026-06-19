import { Schema, model, Document, Types } from 'mongoose';

export interface IMeal {
  name: string;
  time: string;
  foods: string[];
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface INutritionPlan extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  meals: IMeal[];
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  createdAt: Date;
}

const mealSchema = new Schema<IMeal>(
  {
    name: { type: String, required: true },
    time: { type: String, required: true },
    foods: [{ type: String }],
    calories: { type: Number, required: true },
    proteins: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
  },
  { _id: false },
);

const nutritionPlanSchema = new Schema<INutritionPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    meals: { type: [mealSchema], required: true },
    calories: { type: Number, required: true },
    proteins: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const NutritionPlanModel = model<INutritionPlan>('NutritionPlan', nutritionPlanSchema);
