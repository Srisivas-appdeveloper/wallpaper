import type { FastifyRequest } from 'fastify';
import { query } from '../../db/pool.js';
import type { AdminClaims } from './auth.js';

interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  adminId?: string;
}

const json = (v: unknown) => (v === undefined ? null : JSON.stringify(v));

export async function recordAudit(request: FastifyRequest, entry: AuditEntry): Promise<void> {
  const adminId = entry.adminId ?? (request.user as AdminClaims | undefined)?.sub ?? null;
  await query(
    `INSERT INTO admin_audit_logs (admin_id, action, entity, entity_id, before, after, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [adminId, entry.action, entry.entity, entry.entityId ?? null, json(entry.before), json(entry.after), request.ip],
  );
}
