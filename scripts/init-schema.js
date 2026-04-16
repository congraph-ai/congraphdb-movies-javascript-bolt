/**
 * Initialize CongraphDB schema for Movies database
 *
 * NOTE: This script uses Cypher queries which require explicit schema creation.
 * For the JavaScript API approach, use seed-database.js instead which handles
 * schema dynamically.
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
      CREATE REL TABLE ACTED_IN(
        FROM Person TO Movie,
        roles array<STRING>
      )
    `);
    console.log('  - Created ACTED_IN relationship table');

    // Create Directed relationship table
    await conn.query(`
      CREATE REL TABLE DIRECTED(
        FROM Person TO Movie
      )
    `);
    console.log('  - Created DIRECTED relationship table');

    // Create Produced relationship table
    await conn.query(`
      CREATE REL TABLE PRODUCED(
        FROM Person TO Movie
      )
    `);
    console.log('  - Created PRODUCED relationship table');

    // Create Wrote relationship table
    await conn.query(`
      CREATE REL TABLE WROTE(
        FROM Person TO Movie
      )
    `);
    console.log('  - Created WROTE relationship table');

    // Create FOLLOWS relationship table
    await conn.query(`
      CREATE REL TABLE FOLLOWS(
        FROM Person TO Person
      )
    `);
    console.log('  - Created FOLLOWS relationship table');

    // Create REVIEWED relationship table
    await conn.query(`
      CREATE REL TABLE REVIEWED(
        FROM Person TO Movie,
        rating INTEGER,
        summary STRING
      )
    `);
    console.log('  - Created REVIEWED relationship table');

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
