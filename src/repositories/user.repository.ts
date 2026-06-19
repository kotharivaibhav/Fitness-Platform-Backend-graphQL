import { FilterQuery, UpdateQuery } from 'mongoose';
import { UserModel, IUser } from '../models/User';

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return UserModel.create(data);
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+password');
    return query.exec();
  }

  async findByIds(ids: string[]): Promise<IUser[]> {
    return UserModel.find({ _id: { $in: ids } });
  }

  async findAll(filter: FilterQuery<IUser> = {}): Promise<IUser[]> {
    return UserModel.find(filter).sort({ createdAt: -1 });
  }

  async update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const userRepository = new UserRepository();
