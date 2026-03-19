/**
 * Initialize CongraphDB schema for Movies database
 *
 * Run this script once to create the database schema:
 *   node scripts/init-schema.js
 */

const { Database } = require('congraphdb');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'movies.cgraph');
const db = new Database(dbPath);

async function initSchema() {
  console.log(`Initializing database schema at: ${dbPath}`);

  try {
    // Initialize the database
    await db.init();
    const conn = db.createConnection();

    console.log('Creating node tables...');

    // Create Movie table
    await conn.query(`
      CREATE NODE TABLE Movie(
        title STRING,
        tagline STRING,
        released INT64,
        votes INT64,
        PRIMARY KEY (title)
      )
    `);
    console.log('  - Created Movie table');

    // Create Person table
    await conn.query(`
      CREATE NODE TABLE Person(
        name STRING,
        born INT64,
        PRIMARY KEY (name)
      )
    `);
    console.log('  - Created Person table');

    console.log('Creating relationship tables...');

    // Create Acted_in relationship table
    await conn.query(`
      CREATE REL TABLE Acted_in(
        FROM Person TO Movie,
        roles STRING_LIST
      )
    `);
    console.log('  - Created Acted_in relationship table');

    // Create Directed relationship table
    await conn.query(`
      CREATE REL TABLE Directed(
        FROM Person TO Movie
      )
    `);
    console.log('  - Created Directed relationship table');

    // Create Produced relationship table
    await conn.query(`
      CREATE REL TABLE Produced(
        FROM Person TO Movie
      )
    `);
    console.log('  - Created Produced relationship table');

    // Create Wrote relationship table
    await conn.query(`
      CREATE REL TABLE Wrote(
        FROM Person TO Movie
      )
    `);
    console.log('  - Created Wrote relationship table');

    console.log('Schema created successfully!');
    console.log('Now run: node scripts/seed-data.js');

    await db.close();
  } catch (error) {
    console.error('Error initializing schema:', error.message);
    process.exit(1);
  }
}

// Run initialization
initSchema();
