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
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'),
    NEXTAUTH_URL: 'http://localhost:3000',
    DATABASE_URL: 'file:./dev.db',
    ADMIN_EMAIL: 'admin@virtuehearts.org',
    ADMIN_PASSWORD: 'InitialAdminPassword123!',
    OPENROUTER_API_KEY: 'sk-or-v1-placeholder',
  };

  let updated = false;
  for (const [key, value] of Object.entries(defaultEnv)) {
    if (!envContent.includes(`${key}=`)) {
      console.log(`Adding missing environment variable: ${key}`);
      envContent += `\n${key}=${value}`;
      updated = true;
    }
  }

  if (updated || !fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('Environment file updated.');
  } else {
    console.log('Environment file is already complete.');
  }

  if (!envContent.includes('NEXTAUTH_URL=http://localhost:3000')) {
    console.warn('\n[IMPORTANT] NEXTAUTH_URL in .env does not match the default. Ensure it matches your access URL.');
  } else {
    console.log('\n[TIP] If you access the site via a different port or 127.0.0.1, please update NEXTAUTH_URL in .env');
  }

  console.log('--- Initialization Complete ---');

  console.log('--- Running Database Setup ---');
  try {
    execSync('node scripts/setup-db.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Database setup failed:', error.message);
  }
}

main();
