import { Request } from 'express';
import { JwtPayload } from '../utils/jwt';
import '../types/express';
import { Loaders, createLoaders } from './loaders';

export interface GraphQLContext {
  user: JwtPayload | null;
  loaders: Loaders;
  req: Request;
}

export function createContext(req: Request): GraphQLContext {
  return {
    user: req.user ?? null,
    loaders: createLoaders(),
    req,
  };
}
