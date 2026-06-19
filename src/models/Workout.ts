import { Schema, model, Document, Types } from 'mongoose';

export interface IExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  restSeconds?: number;
}

export interface IWorkout extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  workoutName: string;
  workoutType: 'STRENGTH' | 'CARDIO' | 'HIIT' | 'FLEXIBILITY' | 'MIXED';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  exercises: IExercise[];
  duration: number;
  caloriesBurn: number;
  createdAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    weight: { type: Number },
    duration: { type: Number },
    restSeconds: { type: Number },
  },
  { _id: false },
);

const workoutSchema = new Schema<IWorkout>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workoutName: { type: String, required: true },
    workoutType: {
      type: String,
      enum: ['STRENGTH', 'CARDIO', 'HIIT', 'FLEXIBILITY', 'MIXED'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
    },
    exercises: { type: [exerciseSchema], required: true },
    duration: { type: Number, required: true },
    caloriesBurn: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

workoutSchema.index({ userId: 1, createdAt: -1 });

export const WorkoutModel = model<IWorkout>('Workout', workoutSchema);
