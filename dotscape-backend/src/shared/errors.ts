import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

/** Expected, user-safe error. Message is shown to clients as-is. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (what = 'Resource') => new AppError(404, 'not_found', `${what} not found`);

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: { code: 'validation_error', message: 'Invalid request', details: error.flatten() },
    });
  }
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
  }
  const statusCode = 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
  if (statusCode === 429) {
    return reply.status(429).send({ error: { code: 'rate_limited', message: 'Too many requests. Slow down a little.' } });
  }
  if (statusCode < 500) {
    return reply.status(statusCode).send({ error: { code: 'request_error', message: error.message } });
  }
  request.log.error({ err: error }, 'Unhandled error');
  return reply.status(500).send({ error: { code: 'internal_error', message: 'Something went wrong' } });
}
