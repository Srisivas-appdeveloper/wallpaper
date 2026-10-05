import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Dotscape%232026%21SecureDb@db.rcegfuwlunoxmeffarhu.supabase.co:5432/postgres';

export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
