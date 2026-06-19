import DataLoader from 'dataloader';
import { workoutRepository } from '../../repositories/workout.repository';
import { progressLogRepository } from '../../repositories/progressLog.repository';
import { notificationRepository } from '../../repositories/notification.repository';
import { userRepository } from '../../repositories/user.repository';
import { IWorkout } from '../../models/Workout';
import { IProgressLog } from '../../models/ProgressLog';
import { INotification } from '../../models/Notification';
import { IUser } from '../../models/User';
import { toObjectIdString } from '../../utils/helpers';

export interface Loaders {
  userLoader: DataLoader<string, IUser | null>;
  workoutsByUserLoader: DataLoader<string, IWorkout[]>;
  progressByUserLoader: DataLoader<string, IProgressLog[]>;
  notificationsByUserLoader: DataLoader<string, INotification[]>;
}

export function createLoaders(): Loaders {
  const userLoader = new DataLoader<string, IUser | null>(async (ids) => {
    const users = await userRepository.findByIds([...ids]);
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    return ids.map((id) => userMap.get(id) ?? null);
  });

  const workoutsByUserLoader = new DataLoader<string, IWorkout[]>(async (userIds) => {
    const workouts = await workoutRepository.findByUserIds([...userIds]);
    const grouped = new Map<string, IWorkout[]>();
    userIds.forEach((id) => grouped.set(id, []));
    workouts.forEach((w) => {
      const uid = toObjectIdString(w.userId);
      grouped.get(uid)?.push(w);
    });
    return userIds.map((id) => grouped.get(id) ?? []);
  });

  const progressByUserLoader = new DataLoader<string, IProgressLog[]>(async (userIds) => {
    const logs = await progressLogRepository.findByUserIds([...userIds]);
    const grouped = new Map<string, IProgressLog[]>();
    userIds.forEach((id) => grouped.set(id, []));
    logs.forEach((l) => {
      const uid = toObjectIdString(l.userId);
      grouped.get(uid)?.push(l);
    });
    return userIds.map((id) => grouped.get(id) ?? []);
  });

  const notificationsByUserLoader = new DataLoader<string, INotification[]>(async (userIds) => {
    const notifications = await notificationRepository.findByUserIds([...userIds]);
    const grouped = new Map<string, INotification[]>();
    userIds.forEach((id) => grouped.set(id, []));
    notifications.forEach((n) => {
      const uid = toObjectIdString(n.userId);
      grouped.get(uid)?.push(n);
    });
    return userIds.map((id) => grouped.get(id) ?? []);
  });

  return {
    userLoader,
    workoutsByUserLoader,
    progressByUserLoader,
    notificationsByUserLoader,
  };
}
