import { resolvers } from '../../src/graphql/resolvers';
import { UserRole } from '../../src/utils/jwt';

describe('GraphQL Resolvers', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockContext = {
    user: { userId: '507f1f77bcf86cd799439011', email: 'test@example.com', role: UserRole.USER },
    loaders: {
      userLoader: { load: jest.fn().mockResolvedValue(mockUser) },
      workoutsByUserLoader: { load: jest.fn().mockResolvedValue([]) },
      progressByUserLoader: { load: jest.fn().mockResolvedValue([]) },
      notificationsByUserLoader: { load: jest.fn().mockResolvedValue([]) },
    },
    req: {} as Express.Request,
  };

  it('resolves User.id from _id', () => {
    const id = resolvers.User.id({ _id: '507f1f77bcf86cd799439011' });
    expect(id).toBe('507f1f77bcf86cd799439011');
  });

  it('resolves Node __resolveType for User', () => {
    expect(resolvers.Node.__resolveType({ email: 'test@example.com' })).toBe('User');
    expect(resolvers.Node.__resolveType({ workoutName: 'HIIT' })).toBe('Workout');
    expect(resolvers.Node.__resolveType({ meals: [] })).toBe('NutritionPlan');
  });

  it('resolves SearchResult union type', () => {
    expect(resolvers.SearchResult.__resolveType({ email: 'a@b.com' })).toBe('User');
  });

  it('loads workouts via DataLoader on User.workouts', async () => {
    await resolvers.User.workouts({ _id: mockUser._id }, {}, mockContext as never);
    expect(mockContext.loaders.workoutsByUserLoader.load).toHaveBeenCalledWith(mockUser._id);
  });

  it('loads user via DataLoader on Workout.user', async () => {
    await resolvers.Workout.user({ userId: mockUser._id }, {}, mockContext as never);
    expect(mockContext.loaders.userLoader.load).toHaveBeenCalledWith(mockUser._id);
  });
});
