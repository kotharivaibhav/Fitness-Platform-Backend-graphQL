import { getRedisPublisher, getRedisSubscriber } from '../config/redis';
import { logger } from '../logger';

export const SUBSCRIPTION_CHANNELS = {
  WORKOUT_COMPLETED: 'subscription:workoutCompleted',
  PROGRESS_UPDATED: 'subscription:progressUpdated',
  NOTIFICATION_RECEIVED: 'subscription:notificationReceived',
} as const;

export type SubscriptionChannel =
  (typeof SUBSCRIPTION_CHANNELS)[keyof typeof SUBSCRIPTION_CHANNELS];

export class PubSubService {
  private publisher = getRedisPublisher();
  private subscriber = getRedisSubscriber();
  private handlers = new Map<string, Set<(payload: string) => void>>();

  async publish(channel: SubscriptionChannel, payload: unknown): Promise<void> {
    const message = JSON.stringify(payload);
    await this.publisher.publish(channel, message);
    logger.debug('PubSub publish', { channel });
  }

  async subscribe(channel: SubscriptionChannel, handler: (payload: string) => void): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        const channelHandlers = this.handlers.get(ch);
        channelHandlers?.forEach((h) => h(message));
      });
    }
    this.handlers.get(channel)!.add(handler);
  }

  async unsubscribe(
    channel: SubscriptionChannel,
    handler: (payload: string) => void,
  ): Promise<void> {
    const channelHandlers = this.handlers.get(channel);
    if (channelHandlers) {
      channelHandlers.delete(handler);
      if (channelHandlers.size === 0) {
        await this.subscriber.unsubscribe(channel);
        this.handlers.delete(channel);
      }
    }
  }
}

export const pubSubService = new PubSubService();
