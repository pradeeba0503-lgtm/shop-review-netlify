import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.NETLIFY_DB_URL;

  if (!connectionString) {
    throw new Error(
      'NETLIFY_DB_URL is not available in the Netlify Function runtime.'
    );
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error(
      'Unexpected error on idle PostgreSQL client:',
      err
    );
  });

  return pool;
}

