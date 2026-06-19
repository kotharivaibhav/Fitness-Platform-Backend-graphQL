/**
 * Queue module placeholder for future background job processing.
 * Extend with BullMQ or similar for async AI plan generation, email notifications, etc.
 */
export const QUEUE_NAMES = {
  AI_WORKOUT_GENERATION: 'ai-workout-generation',
  NOTIFICATION_DELIVERY: 'notification-delivery',
} as const;
