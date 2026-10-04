import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError } from './errors.js';

const uuid = z.string().uuid();

/** Anonymous per-install identity (no account needed). */
export function tryGetInstallId(request: FastifyRequest): string | undefined {
  const raw = request.headers['x-install-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = uuid.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function getInstallId(request: FastifyRequest): string {
  const id = tryGetInstallId(request);
  if (!id) throw new AppError(400, 'missing_install_id', 'Missing or invalid x-install-id header');
  return id;
}

export const pageQuery = {
  limit: z.coerce.number().int().min(1).max(50).default(24),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
};

/** Query-string boolean: only "true"/"false" accepted (z.coerce.boolean treats "false" as true). */
export const queryBool = z.enum(['true', 'false']).transform((v) => v === 'true').optional();

export const idParams = z.object({ id: z.string().uuid() });

export const csv = (value?: string): string[] | undefined =>
  value ? value.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
