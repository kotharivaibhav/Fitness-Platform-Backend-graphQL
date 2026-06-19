import { GraphQLContext } from '../context';
import { authService } from '../../modules/auth/auth.service';
import { userService } from '../../modules/users/user.service';
import { workoutService } from '../../modules/workouts/workout.service';
import { nutritionService } from '../../modules/nutrition/nutrition.service';
import { progressService } from '../../modules/progress/progress.service';
import { analyticsService } from '../../modules/analytics/analytics.service';
import { aiService } from '../../modules/ai/ai.service';
import { DateTimeScalar, JSONScalar } from '../scalars';
import { workoutRepository } from '../../repositories/workout.repository';
import { toObjectIdString } from '../../utils/helpers';

function mapDoc<T extends { _id: unknown; toObject?: () => Record<string, unknown> }>(
  doc: T,
): Record<string, unknown> {
  const obj = doc.toObject ? doc.toObject() : (doc as Record<string, unknown>);
  return { ...obj, id: toObjectIdString(doc._id) };
}

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Node: {
    __resolveType(obj: { email?: string; workoutName?: string; meals?: unknown[] }) {
      if (obj.email !== undefined) return 'User';
      if (obj.workoutName !== undefined) return 'Workout';
      if (obj.meals !== undefined) return 'NutritionPlan';
      return null;
    },
  },

  SearchResult: {
    __resolveType(obj: { email?: string; workoutName?: string; meals?: unknown[] }) {
      if (obj.email !== undefined) return 'User';
      if (obj.workoutName !== undefined) return 'Workout';
      if (obj.meals !== undefined) return 'NutritionPlan';
      return null;
    },
  },

  User: {
    id: (parent: { _id: unknown }) => toObjectIdString(parent._id),
    workouts: (parent: { _id: unknown }, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.workoutsByUserLoader.load(toObjectIdString(parent._id)),
    progressLogs: (parent: { _id: unknown }, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.progressByUserLoader.load(toObjectIdString(parent._id)),
    notifications: (parent: { _id: unknown }, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.notificationsByUserLoader.load(toObjectIdString(parent._id)),
  },

  Workout: {
    id: (parent: { _id: unknown }) => toObjectIdString(parent._id),
    userId: (parent: { userId: unknown }) => toObjectIdString(parent.userId),
    user: (parent: { userId: unknown }, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.userLoader.load(toObjectIdString(parent.userId)),
  },

  WorkoutSession: {
    id: (parent: { _id: unknown }) => toObjectIdString(parent._id),
    userId: (parent: { userId: unknown }) => toObjectIdString(parent.userId),
    workoutId: (parent: { workoutId: unknown }) => toObjectIdString(parent.workoutId),
    workout: (parent: { workoutId: unknown }) =>
      workoutRepository
        .findById(toObjectIdString(parent.workoutId))
        .then((w) => (w ? mapDoc(w) : null)),
  },

  NutritionPlan: {
    id: (parent: { _id: unknown }) => toObjectIdString(parent._id),
    userId: (parent: { userId: unknown }) => toObjectIdString(parent.userId),
  },

  ProgressLog: {
    id: (parent: { _id: unknown }) => toObjectIdString(parent._id),
    userId: (parent: { userId: unknown }) => toObjectIdString(parent.userId),
  },

  Notification: {
    id: (parent: { _id: unknown }) => toObjectIdString(parent._id),
    userId: (parent: { userId: unknown }) => toObjectIdString(parent.userId),
  },

  WorkoutCompletedPayload: {
    session: (parent: { session: Record<string, unknown> }) => parent.session,
    workout: (parent: { workout: Record<string, unknown> }) => parent.workout,
  },

  ProgressUpdatedPayload: {
    progressLog: (parent: { progressLog: Record<string, unknown> }) => parent.progressLog,
  },

  NotificationReceivedPayload: {
    notification: (parent: { notification: Record<string, unknown> }) => parent.notification,
  },

  Query: {
    getUser: (_: unknown, { id }: { id: string }) => userService.getUser(id).then(mapDoc),

    getUsers: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      userService.getUsers(ctx.user!).then((users) => users.map(mapDoc)),

    getWorkout: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      workoutService.getWorkout(id, ctx.user!).then(mapDoc),

    getWorkouts: (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) =>
      workoutService.getWorkouts(userId, ctx.user!).then((w) => w.map(mapDoc)),

    getNutritionPlan: (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) =>
      nutritionService.getNutritionPlan(userId, ctx.user!).then(mapDoc),

    getProgress: (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) =>
      progressService.getProgress(userId, ctx.user!).then((logs) => logs.map(mapDoc)),

    analytics: (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) =>
      analyticsService.getAnalytics(userId, ctx.user!),

    me: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      userService.getUser(ctx.user!.userId).then(mapDoc),
  },

  Mutation: {
    register: (_: unknown, { input }: { input: unknown }) =>
      authService.register(input).then(({ user, tokens }) => ({
        user: mapDoc(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })),

    login: (_: unknown, { input }: { input: unknown }) =>
      authService.login(input).then(({ user, tokens }) => ({
        user: mapDoc(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })),

    refreshToken: (_: unknown, { input }: { input: unknown }) => authService.refreshToken(input),

    logout: (_: unknown, { refreshToken }: { refreshToken: string }) =>
      authService.logout(refreshToken),

    updateProfile: (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
      userService.updateProfile(ctx.user!.userId, input).then(mapDoc),

    createWorkout: (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
      workoutService.createWorkout(ctx.user!.userId, input).then(mapDoc),

    updateWorkout: (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext,
    ) => workoutService.updateWorkout(id, ctx.user!.userId, input).then(mapDoc),

    deleteWorkout: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      workoutService.deleteWorkout(id, ctx.user!.userId),

    generateWorkoutPlan: (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
      aiService.generateAndStoreWorkoutPlan(ctx.user!.userId, input).then(mapDoc),

    generateNutritionPlan: (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
      aiService.generateAndStoreNutritionPlan(ctx.user!.userId, input).then(mapDoc),

    addProgressLog: (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
      progressService.addProgressLog(ctx.user!.userId, input).then(mapDoc),

    markWorkoutCompleted: (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
      workoutService
        .markWorkoutCompleted(ctx.user!.userId, input)
        .then(({ session }) => mapDoc(session)),
  },
};
