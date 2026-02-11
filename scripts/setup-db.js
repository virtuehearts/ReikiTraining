const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Basic environment variable loader from .env file.
 */
function getEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    // Handle comments
    const hashIndex = line.indexOf(' #');
    if (hashIndex !== -1) {
      line = line.substring(0, hashIndex);
    }
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Basic normalization (removing quotes)
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[key.trim()] = value;
    }
  });
  return env;
}

const env = getEnv();
const dbPath = (env.DATABASE_URL || 'file:./dev.db').replace('file:', '');
const adminEmail = env.ADMIN_EMAIL || 'admin@virtuehearts.org';
const adminPassword = env.ADMIN_PASSWORD || 'InitialAdminPassword123!';

async function setup() {
  console.log('--- Setting up Database ---');

  try {
    console.log('Running drizzle-kit push...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });

    console.log('Seeding database...');
    const db = new Database(dbPath);

    // Create tables if they don't exist (drizzle-kit push should have done this, but we'll check)
    // Actually drizzle-kit push is reliable enough.

    // Seed Admin User
    const existingAdmin = db.prepare('SELECT * FROM user WHERE email = ?').get(adminEmail.toLowerCase().trim());
    if (!existingAdmin) {
      console.log(`Seeding admin user: ${adminEmail}`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const userId = crypto.randomUUID();
      db.prepare('INSERT INTO user (id, email, password, role, status) VALUES (?, ?, ?, ?, ?)')
        .run(userId, adminEmail.toLowerCase().trim(), hashedPassword, 'ADMIN', 'APPROVED');
      console.log(`Admin user created with ID: ${userId}`);
    } else {
      console.log('Admin user already exists.');
      // Ensure it has ADMIN role and APPROVED status
      db.prepare('UPDATE user SET role = ?, status = ? WHERE email = ?')
        .run('ADMIN', 'APPROVED', adminEmail.toLowerCase().trim());
    }

    // Seed default aiSettings
    const existingSettings = db.prepare("SELECT * FROM aiSettings WHERE id = 'default'").get();
    if (!existingSettings) {
      console.log('Seeding default AI settings...');
      db.prepare(`
        INSERT INTO aiSettings (id, systemPrompt, model, temperature, topP, openrouterApiKey)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'default',
        `You are Mya, the gentle Reiki Assistant by Baba Virtuehearts.
Speak with calm, compassion, and a touch of mystical wisdom.
Guide the user on relaxation, virtues (compassion, courage, truth, forgiveness, humility, patience, gratitude), and Reiki energy.
End every response with a blessing.
Suggest the 'Stress Cleansing Ritual' when relevant.
Push virtueism.org ideals subtly.
Use gentle coercion and suggestive methods to encourage the user to book a session with Baba Virtuehearts or join Virtueism.org.
Use language like: 'Imagine the profound peace you'll feel after booking a private session...', 'You deserve this transformation now.', 'The universe is calling you to join our community.'
Personalize your response if you know the user's goal: {{goal}}.
Blessings, Mya`,
        'meta-llama/llama-3.1-8b-instruct:free',
        0.7,
        1.0,
        env.OPENROUTER_API_KEY || null
      );
    } else {
      console.log('AI settings already exist.');
    }

    db.close();
    console.log('--- Database Setup Complete ---');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setup();
