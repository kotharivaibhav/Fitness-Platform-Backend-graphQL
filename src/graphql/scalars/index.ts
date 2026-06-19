import { GraphQLScalarType, Kind } from 'graphql';

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 DateTime scalar',
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return new Date(value).toISOString();
    throw new Error('DateTime cannot represent non-date value');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    throw new Error('DateTime cannot represent non-date value');
  },
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize(value: unknown): unknown {
    return value;
  },
  parseValue(value: unknown): unknown {
    return value;
  },
  parseLiteral(ast): unknown {
    switch (ast.kind) {
      case Kind.STRING:
        return ast.value;
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.NULL:
        return null;
      case Kind.OBJECT:
        return ast.fields.reduce(
          (acc, field) => {
            acc[field.name.value] = JSONScalar.parseLiteral(field.value);
            return acc;
          },
          {} as Record<string, unknown>,
        );
      case Kind.LIST:
        return ast.values.map((v) => JSONScalar.parseLiteral(v));
      default:
        return null;
    }
  },
});
