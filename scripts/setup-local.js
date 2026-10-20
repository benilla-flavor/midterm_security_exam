/**
 * LOCAL SETUP
 * One command to get a working development copy:
 *   1. Creates .env from .env.example with freshly generated secrets (never overwrites an existing value)
 *   2. Creates the secure_clinic database and loads server/database/schema.sql (with seed data)
 *   3. Creates the least-privilege clinic_app_user role and applies server/database/create-user.sql grants
 *
 * Needs a running PostgreSQL 15+ and the superuser password in PG_SUPERUSER_PASSWORD
 * (in .env or the environment). Run:  npm run setup
 * Start over with a fresh database:   npm run setup -- --reset
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const reset = process.argv.includes('--reset');

const secret = (bytes) => randomBytes(bytes).toString('base64url');

// ---------------------------------------------------------------- .env

const DEFAULTS = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'secure_clinic',
  DB_USER: 'clinic_app_user',
  DB_PASSWORD: () => secret(24),
  JWT_ACCESS_SECRET: () => secret(48),
  JWT_REFRESH_SECRET: () => secret(48),
  ENCRYPTION_KEY: () => secret(32)
};

const PLACEHOLDER = /^(your_|CHANGE_ME)/;

function ensureEnv() {
  const source = existsSync(envPath) ? readFileSync(envPath, 'utf8') : readFileSync(path.join(root, '.env.example'), 'utf8');
  let text = source;
  const filled = [];

  for (const [key, value] of Object.entries(DEFAULTS)) {
    const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
    const current = match ? match[1].trim() : '';
    if (current && !PLACEHOLDER.test(current)) continue;
    const next = typeof value === 'function' ? value() : value;
    text = match ? text.replace(match[0], `${key}=${next}`) : `${text.trimEnd()}\n${key}=${next}\n`;
    filled.push(key);
  }

  if (text !== source || !existsSync(envPath)) {
    writeFileSync(envPath, text);
  }
  console.log(filled.length ? `✓ .env ready (generated: ${filled.join(', ')})` : '✓ .env already complete');

  return Object.fromEntries(
    text.split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
  );
}

// ------------------------------------------------------------ database

const quoteLiteral = (value) => `'${String(value).replace(/'/g, "''")}'`;
const quoteIdent = (value) => `"${String(value).replace(/"/g, '""')}"`;

async function connect(env, database) {
  const client = new pg.Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: process.env.PG_SUPERUSER || env.PG_SUPERUSER || 'postgres',
    password: process.env.PG_SUPERUSER_PASSWORD || env.PG_SUPERUSER_PASSWORD,
    database
  });
  await client.connect();
  return client;
}

async function setupDatabase(env) {
  if (!(process.env.PG_SUPERUSER_PASSWORD || env.PG_SUPERUSER_PASSWORD)) {
    throw new Error('Set PG_SUPERUSER_PASSWORD (the password of the "postgres" user) in .env or the environment, then run again.');
  }

  const admin = await connect(env, 'postgres');
  try {
    if (reset) {
      await admin.query(`DROP DATABASE IF EXISTS ${quoteIdent(env.DB_NAME)} WITH (FORCE)`);
      console.log(`✓ dropped database ${env.DB_NAME}`);
    }
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.DB_NAME]);
    if (!exists.rowCount) {
      await admin.query(`CREATE DATABASE ${quoteIdent(env.DB_NAME)}`);
      console.log(`✓ created database ${env.DB_NAME}`);
    }

    // Least-privilege application role (password comes from .env, not the SQL file).
    const role = await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [env.DB_USER]);
    const verb = role.rowCount ? 'ALTER' : 'CREATE';
    await admin.query(`${verb} ROLE ${quoteIdent(env.DB_USER)} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD ${quoteLiteral(env.DB_PASSWORD)}`);
    console.log(`✓ ${verb === 'CREATE' ? 'created' : 'updated'} role ${env.DB_USER}`);
  } finally {
    await admin.end();
  }

  const db = await connect(env, env.DB_NAME);
  try {
    const hasSchema = await db.query("SELECT to_regclass('public.users') IS NOT NULL AS present");
    if (!hasSchema.rows[0].present) {
      await db.query(readFileSync(path.join(root, 'server/database/schema.sql'), 'utf8'));
      console.log('✓ loaded schema.sql (tables + demo accounts)');
    } else {
      console.log('✓ schema already loaded (use --reset to start over)');
    }

    // Apply create-user.sql's grants. Its CREATE USER line (with a placeholder password) is skipped:
    // the role was created above with the generated password.
    for (const [key, value] of [['DB_USER', env.DB_USER], ['DB_NAME', env.DB_NAME]]) {
      if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`${key} must be a lowercase SQL name (letters, digits, _).`);
    }
    const grants = readFileSync(path.join(root, 'server/database/create-user.sql'), 'utf8')
      .replace(/^CREATE USER .*;$/m, '')
      .replace(/clinic_app_user/g, env.DB_USER)
      .replace(/DATABASE secure_clinic/g, `DATABASE ${env.DB_NAME}`);
    await db.query(grants);
    console.log(`✓ granted ${env.DB_USER} SELECT/INSERT/UPDATE/DELETE only`);
  } finally {
    await db.end();
  }
}

try {
  const env = ensureEnv();
  await setupDatabase(env);
  console.log('\nDone. Start the app with:  npm run dev');
  console.log('Demo sign-ins: patient@clinic.com / Patient123!, doctor@clinic.com / Doctor123!, admin@clinic.com / Admin123!');
} catch (error) {
  console.error(`\n✗ Setup failed: ${error.message}`);
  if (error.code === 'ECONNREFUSED') console.error('  Is PostgreSQL running on', `${error.address}:${error.port}?`);
  if (error.code === '28P01') console.error('  The postgres password in PG_SUPERUSER_PASSWORD is wrong.');
  process.exit(1);
}
