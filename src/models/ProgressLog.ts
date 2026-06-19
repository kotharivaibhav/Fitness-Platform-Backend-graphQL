import { Schema, model, Document, Types } from 'mongoose';

export interface IProgressLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  weight?: number;
  bodyFat?: number;
  waterIntake?: number;
  caloriesConsumed?: number;
  loggedAt: Date;
}

const progressLogSchema = new Schema<IProgressLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weight: { type: Number },
  bodyFat: { type: Number, min: 0, max: 100 },
  waterIntake: { type: Number },
  caloriesConsumed: { type: Number },
  loggedAt: { type: Date, default: Date.now },
});

progressLogSchema.index({ userId: 1, loggedAt: -1 });

export const ProgressLogModel = model<IProgressLog>('ProgressLog', progressLogSchema);
