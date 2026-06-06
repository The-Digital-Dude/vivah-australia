#!/usr/bin/env node
/**
 * scripts/db-backup.mjs
 *
 * Creates a timestamped mongodump archive of the Vivah Australia database
 * and optionally uploads it to an S3-compatible bucket.
 *
 * Usage:
 *   MONGODB_URI=mongodb://... node scripts/db-backup.mjs
 *   node scripts/db-backup.mjs mongodb://localhost:27017/vivah_dev
 *
 * Environment variables:
 *   MONGODB_URI        — MongoDB connection string (REQUIRED)
 *   BACKUP_DIR         — local directory for backup archives (default: .backups/)
 *   BACKUP_S3_BUCKET   — S3 bucket name to upload to (OPTIONAL)
 *   BACKUP_S3_PREFIX   — key prefix inside the bucket (default: backups/)
 *
 * Requires:
 *   - mongodump (MongoDB Database Tools) on PATH
 *   - aws CLI on PATH (only when BACKUP_S3_BUCKET is set)
 */

import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';

// ── Config ─────────────────────────────────────────────────────────────────
const MONGODB_URI   = process.env.MONGODB_URI   ?? process.argv[2];
const BACKUP_DIR    = path.resolve(process.env.BACKUP_DIR    ?? '.backups');
const S3_BUCKET     = process.env.BACKUP_S3_BUCKET;
const S3_PREFIX     = (process.env.BACKUP_S3_PREFIX ?? 'backups').replace(/\/$/, '');

if (!MONGODB_URI) {
  console.error('❌  db-backup: MONGODB_URI is required.');
  console.error('    Set it as an environment variable or pass it as the first argument.');
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function isCommandAvailable(cmd) {
  const result = spawnSync(cmd, ['--version'], { stdio: 'pipe' });
  return result.status === 0;
}

function run(cmd, options = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...options });
}

// ── Pre-flight checks ────────────────────────────────────────────────────────
if (!isCommandAvailable('mongodump')) {
  console.error('❌  db-backup: mongodump not found on PATH.');
  console.error('    Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools');
  process.exit(1);
}

if (S3_BUCKET && !isCommandAvailable('aws')) {
  console.error('❌  db-backup: BACKUP_S3_BUCKET is set but aws CLI is not on PATH.');
  console.error('    Install AWS CLI: https://aws.amazon.com/cli/');
  process.exit(1);
}

// ── Paths ────────────────────────────────────────────────────────────────────
const timestamp   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dumpName    = `vivah-db-${timestamp}`;
const dumpPath    = path.join(BACKUP_DIR, dumpName);
const archivePath = `${dumpPath}.tar.gz`;

mkdirSync(BACKUP_DIR, { recursive: true });

// ── Step 1: mongodump ────────────────────────────────────────────────────────
console.log(`\n📦  Running mongodump → ${dumpPath}`);
const dump = spawnSync(
  'mongodump',
  ['--uri', MONGODB_URI, '--out', dumpPath],
  { stdio: 'inherit' },
);

if (dump.status !== 0) {
  console.error('\n❌  mongodump failed.');
  process.exit(1);
}

// ── Step 2: Compress ─────────────────────────────────────────────────────────
console.log(`\n🗜️   Compressing → ${archivePath}`);
run(`tar -czf "${archivePath}" -C "${BACKUP_DIR}" "${dumpName}"`);
rmSync(dumpPath, { recursive: true, force: true });

console.log(`\n✅  Archive created: ${archivePath}`);

// ── Step 3: Upload to S3 (optional) ─────────────────────────────────────────
if (S3_BUCKET) {
  const s3Key = `${S3_PREFIX}/${dumpName}.tar.gz`;
  console.log(`\n☁️   Uploading to s3://${S3_BUCKET}/${s3Key}`);
  run(`aws s3 cp "${archivePath}" "s3://${S3_BUCKET}/${s3Key}" --storage-class STANDARD_IA`);
  console.log('✅  S3 upload complete.');
}

console.log('\n🎉  Database backup finished successfully.\n');
