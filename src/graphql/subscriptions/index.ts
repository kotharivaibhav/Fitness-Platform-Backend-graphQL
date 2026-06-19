import { pubSubService, SUBSCRIPTION_CHANNELS } from '../../cache/pubsub.service';
import { GraphQLContext } from '../context';
import { AuthError } from '../../errors';

type AsyncIterator<T> = AsyncIterableIterator<T>;

function createRedisAsyncIterator<T>(
  channel: string,
  filterFn: (payload: T, context: GraphQLContext, args: Record<string, unknown>) => boolean,
): {
  subscribe: (
    _parent: unknown,
    args: Record<string, unknown>,
    context: GraphQLContext,
  ) => AsyncIterator<T>;
} {
  return {
    subscribe: (_parent, args, context) => {
      if (!context.user) {
        throw new AuthError('Authentication required for subscriptions');
      }

      const queue: T[] = [];
      const resolvers: Array<(value: IteratorResult<T>) => void> = [];
      let done = false;

      const handler = (message: string) => {
        try {
          const payload = JSON.parse(message) as T;
          if (filterFn(payload, context, args)) {
            if (resolvers.length > 0) {
              const resolve = resolvers.shift()!;
              resolve({ value: payload, done: false });
            } else {
              queue.push(payload);
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      pubSubService.subscribe(channel as typeof SUBSCRIPTION_CHANNELS.WORKOUT_COMPLETED, handler);

      const iterator: AsyncIterator<T> = {
        next: () => {
          if (queue.length > 0) {
            return Promise.resolve({ value: queue.shift()!, done: false });
          }
          if (done) {
            return Promise.resolve({ value: undefined as unknown as T, done: true });
          }
          return new Promise((resolve) => {
            resolvers.push(resolve);
          });
        },
        return: async () => {
          done = true;
          await pubSubService.unsubscribe(
            channel as typeof SUBSCRIPTION_CHANNELS.WORKOUT_COMPLETED,
            handler,
          );
          return { value: undefined as unknown as T, done: true };
        },
        throw: async (error) => {
          done = true;
          await pubSubService.unsubscribe(
            channel as typeof SUBSCRIPTION_CHANNELS.WORKOUT_COMPLETED,
            handler,
          );
          throw error;
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };

      return iterator;
    },
  };
}

interface WorkoutCompletedPayload {
  session: Record<string, unknown>;
  workout: Record<string, unknown>;
  userId: string;
}

interface ProgressUpdatedPayload {
  progressLog: Record<string, unknown>;
  userId: string;
}

interface NotificationReceivedPayload {
  notification: Record<string, unknown>;
  userId: string;
}

export const subscriptionResolvers = {
  workoutCompleted: createRedisAsyncIterator<WorkoutCompletedPayload>(
    SUBSCRIPTION_CHANNELS.WORKOUT_COMPLETED,
    (payload, context, args) =>
      payload.userId === args.userId && payload.userId === context.user!.userId,
  ),
  progressUpdated: createRedisAsyncIterator<ProgressUpdatedPayload>(
    SUBSCRIPTION_CHANNELS.PROGRESS_UPDATED,
    (payload, context, args) =>
      payload.userId === args.userId && payload.userId === context.user!.userId,
  ),
  notificationReceived: createRedisAsyncIterator<NotificationReceivedPayload>(
    SUBSCRIPTION_CHANNELS.NOTIFICATION_RECEIVED,
    (payload, context, args) =>
      payload.userId === args.userId && payload.userId === context.user!.userId,
  ),
};
