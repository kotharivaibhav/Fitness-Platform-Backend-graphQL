import { Types } from 'mongoose';
import { progressLogRepository } from '../../repositories/progressLog.repository';
import { cacheService } from '../../cache/cache.service';
import { pubSubService, SUBSCRIPTION_CHANNELS } from '../../cache/pubsub.service';
import { ForbiddenError } from '../../errors';
import { validateInput, progressLogSchema } from '../../validation/schemas';
import { IProgressLog } from '../../models/ProgressLog';
import { JwtPayload } from '../../utils/jwt';

export class ProgressService {
  async getProgress(userId: string, requester: JwtPayload): Promise<IProgressLog[]> {
    if (userId !== requester.userId && requester.role !== 'ADMIN') {
      throw new ForbiddenError('Cannot access progress logs');
    }
    return progressLogRepository.findByUserId(userId);
  }

  async addProgressLog(userId: string, input: unknown): Promise<IProgressLog> {
    const data = validateInput(progressLogSchema, input);
    const log = await progressLogRepository.create({
      userId: new Types.ObjectId(userId),
      ...data,
      loggedAt: new Date(),
    });

    await cacheService.invalidateUser(userId);

    await pubSubService.publish(SUBSCRIPTION_CHANNELS.PROGRESS_UPDATED, {
      progressLog: log.toObject(),
      userId,
    });

    return log;
  }
}

export const progressService = new ProgressService();
