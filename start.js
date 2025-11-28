#!/usr/bin/env node

// Startup wrapper to catch any errors before server even starts
console.log('========================================');
console.log('🔍 PocketBizz Startup Wrapper');
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('CWD:', process.cwd());
console.log('ENV:', process.env.NODE_ENV);
console.log('========================================');

// Check if dist/index.js exists
import { existsSync } from 'fs';
import { resolve } from 'path';

const distPath = resolve(process.cwd(), 'dist', 'index.js');
console.log('Checking for:', distPath);
console.log('Exists:', existsSync(distPath));

if (!existsSync(distPath)) {
  console.error('❌ FATAL: dist/index.js not found!');
  console.error('Build may have failed or files not copied correctly.');
  process.exit(1);
}

console.log('✅ dist/index.js found, attempting to import...');

// Try to import the main server
try {
  await import('./dist/index.js');
  console.log('✅ Server module loaded successfully');
} catch (error) {
  console.error('========================================');
  console.error('❌ FATAL ERROR loading server:');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('========================================');
  process.exit(1);
}

