const Database = require('better-sqlite3');
const path = require('path');

function verifyDb() {
  console.log('--- Verifying Database Schema ---');
  const dbPath = path.join(process.cwd(), 'dev.db');
  const db = new Database(dbPath);

  try {
    const tableInfo = db.prepare("PRAGMA table_info(aiSettings)").all();
    const columnNames = tableInfo.map(c => c.name);

    console.log('Columns in aiSettings:', columnNames.join(', '));

    if (columnNames.includes('openrouterApiKey')) {
      console.log('SUCCESS: openrouterApiKey column exists.');
    } else {
      console.error('FAILURE: openrouterApiKey column is missing!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error verifying database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

verifyDb();
