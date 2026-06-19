import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import { getComplexity, simpleEstimator, fieldExtensionsEstimator } from 'graphql-query-complexity';
import { config } from '../config';
import { cacheService } from '../cache/cache.service';
import { hashPersistedQuery } from '../utils/helpers';
import { logGraphQLQuery } from '../logger';
import { formatGraphQLError } from '../errors';
import { GraphQLContext } from '../graphql/context';

export const depthLimitValidationRule = depthLimit(config.GRAPHQL_MAX_DEPTH);

export function createComplexityPlugin(): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart(): Promise<GraphQLRequestListener<GraphQLContext>> {
      return {
        async didResolveOperation(requestContext) {
          const { schema, request } = requestContext;
          const complexity = getComplexity({
            schema,
            operationName: request.operationName ?? undefined,
            query: requestContext.document!,
            variables: request.variables ?? {},
            estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
          });

          if (complexity > config.GRAPHQL_MAX_COMPLEXITY) {
            throw new Error(
              `Query complexity ${complexity} exceeds maximum ${config.GRAPHQL_MAX_COMPLEXITY}`,
            );
          }
        },
      };
    },
  };
}

export function createLoggingPlugin(): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation(requestContext) {
          logGraphQLQuery(
            requestContext.request.operationName ?? undefined,
            requestContext.request.query ?? '',
            requestContext.request.variables as Record<string, unknown>,
          );
        },
      };
    },
  };
}

export async function resolvePersistedQuery(
  queryHash: string,
  query?: string,
): Promise<string | null> {
  if (query) {
    const hash = hashPersistedQuery(query);
    if (hash !== queryHash) return null;
    await cacheService.setPersistedQuery(queryHash, query);
    return query;
  }
  return cacheService.getPersistedQuery(queryHash);
}

export const apolloErrorFormatter = formatGraphQLError;
