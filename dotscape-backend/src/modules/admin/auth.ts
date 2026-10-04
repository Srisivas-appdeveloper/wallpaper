import '@fastify/jwt';
import type { FastifyRequest } from 'fastify';
import { queryOne } from '../../db/pool.js';
import { AppError } from '../../shared/errors.js';

export const ADMIN_ROLES = ['super_admin', 'admin', 'editor', 'ai_creator', 'moderator', 'analyst'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminClaims { sub: string; email: string; role: AdminRole }

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AdminClaims;
    user: AdminClaims;
  }
}

/** Server-side RBAC (spec §34). super_admin passes every check. */
export function requireRole(...allowed: AdminRole[]) {
  return async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, 'unauthorized', 'Sign in required');
    }
    const admin = await queryOne<{ active: boolean }>('SELECT active FROM admin_users WHERE id = $1', [request.user.sub]);
    if (!admin?.active) throw new AppError(401, 'unauthorized', 'Account disabled');
    if (request.user.role !== 'super_admin' && !allowed.includes(request.user.role)) {
      throw new AppError(403, 'forbidden', 'You do not have permission for this action');
    }
  };
}
