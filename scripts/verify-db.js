const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env
require('dotenv').config();

const dbPath = (process.env.DATABASE_URL || 'file:./dev.db').replace('file:', '');
console.log(`Connecting to database at: ${dbPath}`);

let db;
try {
  db = new Database(dbPath);
} catch (error) {
  console.error('Failed to open database:', error.message);
  process.exit(1);
}

console.log('Verifying tables...');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
console.log('Found tables:', tables.join(', '));

const expectedTables = ['user', 'aiSettings', 'chatMessage', 'message', 'intake', 'progress', 'reflection'];
let missingTables = [];
expectedTables.forEach(table => {
  if (tables.includes(table)) {
    console.log(`  [OK] Table "${table}" exists.`);
  } else {
    console.error(`  [ERROR] Table "${table}" is missing!`);
    missingTables.push(table);
  }
});

if (missingTables.length > 0) {
  console.error('Database verification failed: missing tables.');
  process.exit(1);
}

// Try a simple insert/select on user table
console.log('Testing CRUD on "user" table...');
const testEmail = `test-${Date.now()}@example.com`;
const testId = crypto.randomUUID();

try {
  db.prepare("INSERT INTO user (id, email, role, status) VALUES (?, ?, ?, ?)").run(
    testId,
    testEmail,
    'USER',
    'PENDING'
  );

  const user = db.prepare("SELECT * FROM user WHERE email = ?").get(testEmail);
  if (user && user.email === testEmail) {
    console.log('  [OK] User inserted and retrieved successfully.');
  } else {
    throw new Error('Failed to retrieve inserted user.');
  }

  // Clean up
  db.prepare("DELETE FROM user WHERE email = ?").run(testEmail);
  console.log('  [OK] Test user deleted.');
} catch (error) {
  console.error('  [ERROR] CRUD test failed:', error.message);
  process.exit(1);
}

// Test aiSettings as it's critical for the AI assistant
console.log('Testing "aiSettings" table...');
try {
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM aiSettings").get().count;
  console.log(`  [INFO] Found ${settingsCount} entries in aiSettings.`);

  // If empty, ensure we can insert (though the app should handle this at runtime)
  if (settingsCount === 0) {
    console.log('  [INFO] Inserting default aiSettings...');
    db.prepare("INSERT INTO aiSettings (id, systemPrompt) VALUES (?, ?)").run('default', 'Test prompt');
    const newCount = db.prepare("SELECT COUNT(*) as count FROM aiSettings").get().count;
    if (newCount === 1) {
      console.log('  [OK] Default aiSettings inserted.');
      db.prepare("DELETE FROM aiSettings WHERE id = 'default'").run();
    }
  }
} catch (error) {
  console.error('  [ERROR] aiSettings test failed:', error.message);
  process.exit(1);
}

db.close();
console.log('Database architecture verification successful!');
