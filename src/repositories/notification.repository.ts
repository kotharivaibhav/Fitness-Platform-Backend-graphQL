import { NotificationModel, INotification } from '../models/Notification';

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return NotificationModel.create(data);
  }

  async findByUserId(userId: string, limit = 50): Promise<INotification[]> {
    return NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  async findByUserIds(userIds: string[]): Promise<INotification[]> {
    return NotificationModel.find({ userId: { $in: userIds } }).sort({ createdAt: -1 });
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }
}

export const notificationRepository = new NotificationRepository();
