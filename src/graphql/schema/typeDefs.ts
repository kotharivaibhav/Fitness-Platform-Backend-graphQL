import { readFileSync } from 'fs';
import { join } from 'path';

export const typeDefs = readFileSync(join(__dirname, 'index.graphql'), 'utf-8');
