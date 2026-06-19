import { FilterQuery, UpdateQuery } from 'mongoose';
import { WorkoutModel, IWorkout } from '../models/Workout';

export class WorkoutRepository {
  async create(data: Partial<IWorkout>): Promise<IWorkout> {
    return WorkoutModel.create(data);
  }

  async findById(id: string): Promise<IWorkout | null> {
    return WorkoutModel.findById(id);
  }

  async findByUserId(userId: string): Promise<IWorkout[]> {
    return WorkoutModel.find({ userId }).sort({ createdAt: -1 });
  }

  async findByUserIds(userIds: string[]): Promise<IWorkout[]> {
    return WorkoutModel.find({ userId: { $in: userIds } }).sort({ createdAt: -1 });
  }

  async findAll(filter: FilterQuery<IWorkout> = {}): Promise<IWorkout[]> {
    return WorkoutModel.find(filter).sort({ createdAt: -1 });
  }

  async update(id: string, data: UpdateQuery<IWorkout>): Promise<IWorkout | null> {
    return WorkoutModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await WorkoutModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const workoutRepository = new WorkoutRepository();
