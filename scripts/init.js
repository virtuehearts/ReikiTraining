const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(process.cwd(), '.env');

function main() {
  console.log('--- Initializing Environment ---');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const defaultEnv = {
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'),
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

  console.log('--- Initialization Complete ---');
}

main();
