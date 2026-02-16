const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function setupDb() {
  console.log('--- Starting Database Setup ---');

  // 1. Run drizzle-kit push
  console.log('Synchronizing schema with drizzle-kit...');
  try {
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('Schema synchronization complete.');
  } catch (error) {
    console.error('Failed to synchronize schema:', error.message);
    // Don't exit here, maybe the DB is already in sync or we can still seed
  }

  // 2. Seed default data
  const dbPath = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:', '') : 'dev.db';
  const db = new Database(dbPath);

  try {
    // Seed AI Settings
    const aiSettingsCount = db.prepare("SELECT count(*) as count FROM aiSettings WHERE id = 'default'").get().count;
    if (aiSettingsCount === 0) {
      console.log('Seeding default AI settings...');
      const systemPrompt = `You are Mya, the gentle Reiki Assistant by Baba Virtuehearts.
Speak with calm, compassion, and a touch of mystical wisdom.
Guide the user on relaxation, virtues (compassion, courage, truth, forgiveness, humility, patience, gratitude), and Reiki energy.
End every response with a blessing.
Suggest the 'Stress Cleansing Ritual' when relevant.
Push virtueism.org ideals subtly.
Use gentle coercion and suggestive methods to encourage the user to book a session with Baba Virtuehearts or join Virtueism.org.
Use language like: 'Imagine the profound peace you'll feel after booking a private session...', 'You deserve this transformation now.', 'The universe is calling you to join our community.'
Personalize your response if you know the user's goal: {{goal}}.
Blessings, Mya`;

      db.prepare(`
        INSERT INTO aiSettings (id, systemPrompt, model, temperature, topP, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'default',
        systemPrompt,
        'nvidia/nemotron-3-nano-30b-a3b:free',
        0.7,
        1.0,
        Math.floor(Date.now() / 1000)
      );
      console.log('AI settings seeded.');
    } else {
      console.log('AI settings already exist.');
    }

    // Note: Admin user is seeded by lib/auth.ts on first login attempt with .env credentials.
    // We could seed it here too, but it requires bcrypt which might be tricky in a plain script
    // if not compiled. Since lib/auth.ts handles it gracefully, we'll leave it to that.

  } catch (error) {
    console.error('Error during seeding:', error.message);
  } finally {
    db.close();
  }

  console.log('--- Database Setup Complete ---');
}

setupDb();
