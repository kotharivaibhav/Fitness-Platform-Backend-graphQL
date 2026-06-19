import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { GraphQLSchema, defaultFieldResolver } from 'graphql';
import { AuthError, ForbiddenError } from '../../errors';
import { UserRole } from '../../utils/jwt';
import { GraphQLContext } from '../context';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.TRAINER]: 2,
  [UserRole.ADMIN]: 3,
};

function authDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];
      if (!authDirective) return fieldConfig;

      const requiredRole = (authDirective.role as UserRole | undefined) ?? UserRole.USER;
      const { resolve = defaultFieldResolver } = fieldConfig;

      fieldConfig.resolve = async (source, args, context: GraphQLContext, info) => {
        if (!context.user) {
          throw new AuthError('Authentication required');
        }

        const userRole = context.user.role as UserRole;
        if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
          throw new ForbiddenError(`Requires ${requiredRole} role or higher`);
        }

        return resolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
}

export function applyDirectives(schema: GraphQLSchema): GraphQLSchema {
  return authDirectiveTransformer(schema);
}
