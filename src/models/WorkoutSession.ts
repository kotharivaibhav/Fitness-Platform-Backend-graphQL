import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkoutSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  workoutId: Types.ObjectId;
  completedExercises: string[];
  caloriesBurned: number;
  duration: number;
  completedAt: Date;
}

const workoutSessionSchema = new Schema<IWorkoutSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workoutId: { type: Schema.Types.ObjectId, ref: 'Workout', required: true },
  completedExercises: [{ type: String, required: true }],
  caloriesBurned: { type: Number, required: true },
  duration: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

workoutSessionSchema.index({ userId: 1, completedAt: -1 });

export const WorkoutSessionModel = model<IWorkoutSession>('WorkoutSession', workoutSessionSchema);
