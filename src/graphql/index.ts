import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers';
import { applyDirectives } from './directives/auth.directive';
import { subscriptionResolvers } from './subscriptions';
import { typeDefs } from './schema/typeDefs';

const baseSchema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...resolvers,
    Subscription: subscriptionResolvers,
  },
});

export const schema = applyDirectives(baseSchema);
