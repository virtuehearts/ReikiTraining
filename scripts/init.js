const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const envPath = path.join(process.cwd(), '.env');

function main() {
  console.log('--- Initializing Environment ---');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const defaultEnv = {
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'),
    DATABASE_URL: 'file:./dev.db',
  };

  let updated = false;
  for (const [key, value] of Object.entries(defaultEnv)) {
    if (!envContent.includes(`${key}=`)) {
      console.log(`Adding missing environment variable: ${key}`);
      envContent += `\n${key}="${value}"`;
      updated = true;
    }
  }

  if (updated || !fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('Environment file updated.');
  } else {
    console.log('Environment file is already complete.');
  }

  // Set environment variables for the current process
  require('dotenv').config();

  console.log('--- Syncing Database Schema ---');
  try {
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log('Database schema synced successfully.');
  } catch (error) {
    console.error('Failed to sync database schema:', error.message);
    process.exit(1);
  }

  console.log('--- Verifying Database ---');
  try {
    const Database = require('better-sqlite3');
    const dbPath = process.env.DATABASE_URL.replace('file:', '');
    const db = new Database(dbPath);

    // Simple check to ensure database is working
    const result = db.prepare('SELECT 1 as check_val').get();
    if (result && result.check_val === 1) {
      console.log('Database connection verified.');
    } else {
      throw new Error('Database verification failed: unexpected result');
    }

    db.close();
  } catch (error) {
    console.error('Database verification error:', error.message);
    process.exit(1);
  }

  console.log('--- Initialization Complete ---');
}

main();
