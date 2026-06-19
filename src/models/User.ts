import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../utils/jwt';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  height?: number;
  weight?: number;
  targetWeight?: number;
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  goal?: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH' | 'ENDURANCE' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    age: { type: Number, min: 13, max: 120 },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    height: { type: Number },
    weight: { type: Number },
    targetWeight: { type: Number },
    activityLevel: {
      type: String,
      enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'],
    },
    goal: {
      type: String,
      enum: ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE', 'MAINTENANCE'],
    },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>('User', userSchema);
