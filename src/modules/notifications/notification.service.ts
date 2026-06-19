import { notificationRepository } from '../../repositories/notification.repository';
import { INotification } from '../../models/Notification';

export class NotificationService {
  async getNotifications(userId: string): Promise<INotification[]> {
    return notificationRepository.findByUserId(userId);
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return notificationRepository.markAsRead(id);
  }
}

export const notificationService = new NotificationService();
