/**
 * Netlify Database Connection Helper
 * Uses official @netlify/database getConnectionString() with pg.Pool
 */

import { getConnectionString } from '@netlify/database';
import pg from 'pg';

const { Pool } = pg;

let pool = null;

/**
 * Returns a singleton PostgreSQL connection pool connected via Netlify Database.
 * @returns {pg.Pool}
 */
export function getPool() {
  if (pool) {
    return pool;
  }

  let connectionString;
  try {
    // Official Netlify Database method to resolve environment connection URL
    connectionString = getConnectionString();
  } catch (err) {
    // Fallback if running locally or outside Netlify CLI context
    connectionString =
      process.env.NETLIFY_DB_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL;
  }

  if (!connectionString) {
    throw new Error(
      'Netlify Database connection string not found. Please run with "netlify dev" or configure NETLIFY_DB_URL.'
    );
  }

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  return pool;
}
