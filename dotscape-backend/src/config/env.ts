import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().url(),
  PUBLIC_BASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  STORAGE_DIR: z.string().default('./storage'),
  DAILY_GENERATION_LIMIT: z.coerce.number().int().positive().default(15),
  AI_PROVIDER: z.enum(['procedural']).default('procedural'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@dotscape.local'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe!2026'),
  SUPABASE_URL: z.string().url().default('https://rcegfuwlunoxmeffarhu.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  STORAGE_PROVIDER: z.enum(['local', 'supabase']).default('supabase'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
