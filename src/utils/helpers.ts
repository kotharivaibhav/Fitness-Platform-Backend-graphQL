import crypto from 'crypto';
import { config } from '../config';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashQuery(query: string): string {
  return crypto.createHash('sha256').update(query).digest('hex');
}

export function hashPersistedQuery(query: string): string {
  return crypto.createHmac('sha256', config.CSRF_SECRET).update(query).digest('hex');
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toObjectIdString(id: unknown): string {
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && 'toString' in id) {
    return (id as { toString: () => string }).toString();
  }
  return String(id);
}
