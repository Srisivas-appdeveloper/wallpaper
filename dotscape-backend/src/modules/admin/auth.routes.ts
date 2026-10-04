import bcrypt from 'bcryptjs';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { queryOne } from '../../db/pool.js';
import { AppError } from '../../shared/errors.js';
import { recordAudit } from './audit.js';
import { ADMIN_ROLES, requireRole, type AdminRole } from './auth.js';

type AdminRow = { id: string; email: string; password_hash: string; role: AdminRole; display_name: string; active: boolean };

const loginBody = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request) => {
    const body = loginBody.parse(request.body);
    const admin = await queryOne<AdminRow>('SELECT * FROM admin_users WHERE email = $1', [body.email.toLowerCase()]);
    const valid = admin?.active === true && (await bcrypt.compare(body.password, admin.password_hash));
    if (!admin || !valid) throw new AppError(401, 'invalid_credentials', 'Invalid email or password');

    const token = app.jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, { expiresIn: '12h' });
    await recordAudit(request, { action: 'login', entity: 'admin_user', entityId: admin.id, adminId: admin.id });
    return { token, admin: { id: admin.id, email: admin.email, role: admin.role, displayName: admin.display_name } };
  });

  app.get('/me', { preHandler: requireRole(...ADMIN_ROLES) }, async (request) => ({ admin: request.user }));
};
