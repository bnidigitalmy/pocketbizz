#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a backup of the PostgreSQL database using pg_dump
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

const BACKUP_DIR = join(process.cwd(), 'backups');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('✓ Created backups directory');
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeWithHours = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = join(BACKUP_DIR, `pocketbizz_${timeWithHours}.sql`);
  const compressedFile = `${backupFile}.gz`;

  console.log('🔄 Starting database backup...');
  console.log(`📁 Backup location: ${backupFile}`);

  try {
    // Create backup using pg_dump
    console.log('⏳ Dumping database...');
    await execAsync(`pg_dump "${DATABASE_URL}" > "${backupFile}"`);
    console.log('✓ Database dump completed');

    // Compress the backup
    console.log('⏳ Compressing backup...');
    await execAsync(`gzip "${backupFile}"`);
    console.log('✓ Compression completed');

    // Get file size
    const { stdout: sizeOutput } = await execAsync(`ls -lh "${compressedFile}" | awk '{print $5}'`);
    const fileSize = sizeOutput.trim();

    console.log('\n✅ Backup completed successfully!');
    console.log(`📦 File: ${compressedFile}`);
    console.log(`📊 Size: ${fileSize}`);
    console.log(`🕐 Created: ${new Date().toLocaleString()}`);

    // List recent backups
    console.log('\n📋 Recent backups:');
    const { stdout: listOutput } = await execAsync(`ls -lht "${BACKUP_DIR}" | head -6`);
    console.log(listOutput);

    return compressedFile;
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Run backup
createBackup()
  .then(() => {
    console.log('\n💡 To restore from this backup:');
    console.log('   gunzip -c <backup-file> | psql $DATABASE_URL');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
