import { userRepository } from '../../repositories/user.repository';
import { cacheService } from '../../cache/cache.service';
import { NotFoundError, ForbiddenError } from '../../errors';
import { validateInput, updateProfileSchema } from '../../validation/schemas';
import { IUser } from '../../models/User';
import { JwtPayload, UserRole } from '../../utils/jwt';

export class UserService {
  async getUser(id: string): Promise<IUser> {
    const cached = await cacheService.getUser<IUser>(id);
    if (cached) return cached as IUser;

    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');

    await cacheService.setUser(id, user.toObject());
    return user;
  }

  async getUsers(requester: JwtPayload): Promise<IUser[]> {
    if (requester.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can list all users');
    }
    return userRepository.findAll();
  }

  async updateProfile(userId: string, input: unknown): Promise<IUser> {
    const data = validateInput(updateProfileSchema, input);
    const user = await userRepository.update(userId, data);
    if (!user) throw new NotFoundError('User');

    await cacheService.invalidateUser(userId);
    return user;
  }

  async getUserByIdOrThrow(id: string): Promise<IUser> {
    return this.getUser(id);
  }
}

export const userService = new UserService();
