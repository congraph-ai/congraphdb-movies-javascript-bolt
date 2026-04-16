
/**
 * CongraphDB Demo Movies Database Seeder
 *
 * Initializes the CongraphDB with the FULL sample movies dataset (from Neo4j demo).
 */

'use strict';

const { Database } = require('congraphdb');
const path = require('path');
const fs = require('fs');

async function seedDatabase(dbPath = './movies.cgraph') {
  console.log('Seeding CongraphDB with FULL movies dataset...');
  console.log(`Database path: ${dbPath}`);

  // Load extracted data
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extracted_data.json'), 'utf8'));

  // Initialize database
  const db = new Database(dbPath);
  await db.init();
  const conn = db.createConnection();

  try {
    // Delete existing data by just deleting files if we want a fresh start
    // But since we are already here, we assume the files were deleted if needed.

    // Helper to escape
    const esc = (s) => (s || "").replace(/'/g, "\\'");

    console.log('\nCreating movie nodes...');
    for (const movie of data.movies) {
      const title = esc(movie.title);
      const tagline = esc(movie.tagline);
      const released = movie.released || 0;
      await conn.query(`CREATE (m:Movie {title: '${title}', tagline: '${tagline}', released: ${released}, votes: 0})`);
    }
    console.log(`  Created ${data.movies.length} movies.`);

    console.log('\nCreating person nodes...');
    for (const person of data.people) {
      const name = esc(person.name);
      const born = person.born || 0;
      await conn.query(`CREATE (p:Person {name: '${name}', born: ${born}})`);
    }
    console.log(`  Created ${data.people.length} people.`);

    console.log('\nCreating relationships...');
    let count = 0;
    for (const rel of data.rels) {
      const from = esc(rel.from);
      const to = esc(rel.to);
      const type = rel.type;
      
      let props = '';
      if (rel.roles) {
        props = ` {roles: [${rel.roles.map(r => `'${esc(r)}'`).join(', ')}]}`;
      }

      const query = `
        MATCH (p:Person {name: '${from}'}), (m:Movie {title: '${to}'})
        CREATE (p)-[r:${type}${props}]->(m)
      `;
      // Also handle Person-Person FOLLOWS if any
      const queryFollows = `
        MATCH (a:Person {name: '${from}'}), (b:Person {name: '${to}'})
        CREATE (a)-[r:${type}${props}]->(b)
      `;
      
      // Fallback for FOLLOWS since 'to' might be a Person
      if (type === 'FOLLOWS') {
        await conn.query(queryFollows);
      } else {
        await conn.query(query);
      }
      
      count++;
      if (count % 50 === 0) console.log(`  Created ${count} relationships...`);
    }

    // Special handling for REVIEWED which was missed by naive parser or needs different logic
    // Actually our parser handled most of it.

    console.log('\n=== Seed Complete ===');
    console.log(`Movies: ${data.movies.length}`);
    console.log(`People: ${data.people.length}`);
    console.log(`Relationships: ${data.rels.length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await db.close();
    console.log('\nDatabase closed.');
  }
}

if (require.main === module) {
  const dbPath = process.argv[2] || path.join(__dirname, '..', 'movies.cgraph');
  seedDatabase(dbPath).catch(console.error);
}

module.exports = { seedDatabase };
