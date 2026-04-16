/**
 * CongraphDB Movies Database Seeder
 *
 * Initializes the CongraphDB with the sample movies dataset.
 * Uses raw Cypher queries for better compatibility.
 */

'use strict';

const { Database } = require('congraphdb');
const path = require('path');

const fs = require('fs');

// Helper function to escape single quotes in Cypher strings
function escapeCypherString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/'/g, "\\'");
}

async function seedDatabase(dbPath = './movies.cgraph') {
  console.log('Seeding CongraphDB with movies dataset...');
  console.log(`Database path: ${dbPath}`);

  // Load data from JSON
  const dataPath = path.join(__dirname, 'movie_data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found at ${dataPath}. Please run the generator first.`);
  }
  const { MOVIES, PEOPLE, RELATIONSHIPS } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Initialize database
  const db = new Database(dbPath);
  await db.init();
  const conn = db.createConnection();

  try {
    // Clear existing data for a fresh seed
    console.log('Clearing existing data...');
    // We try multiple ways to be absolutely sure all nodes and edges are gone
    await conn.query("MATCH (n:Movie) DETACH DELETE n");
    await conn.query("MATCH (n:Person) DETACH DELETE n");
    await conn.query("MATCH (n) DETACH DELETE n"); // Catchall for anything else
    
    // Check if anything is left
    const checkNodes = await conn.query("MATCH (n) RETURN count(*) as count");
    const nodeCount = (await checkNodes.getAll())[0]?.count || 0;
    if (nodeCount > 0) {
      console.warn(`Warning: ${nodeCount} nodes still exist after deletion attempt.`);
    }

    // Create movie nodes
    console.log(`\nCreating ${MOVIES.length} movie nodes...`);
    for (const movie of MOVIES) {
      const tagline = escapeCypherString(movie.tagline || '');
      const title = escapeCypherString(movie.title);
      const query = `CREATE (m:Movie {title: '${title}', tagline: '${tagline}', released: ${movie.released || 0}, votes: 0})`;
      await conn.query(query);
    }

    // Create person nodes
    console.log(`\nCreating ${PEOPLE.length} person nodes...`);
    for (const person of PEOPLE) {
      const name = escapeCypherString(person.name);
      const query = `CREATE (p:Person {name: '${name}', born: ${person.born || 0}})`;
      await conn.query(query);
    }

    // Create relationships
    for (const [relType, rels] of Object.entries(RELATIONSHIPS)) {
      if (rels.length === 0) continue;
      console.log(`\nCreating ${rels.length} ${relType} relationships...`);
      
      for (const rel of rels) {
        if (!rel.from || !rel.to) continue;
        
        const fromName = escapeCypherString(rel.from);
        const toName = escapeCypherString(rel.to);
        
        let propsStr = '';
        if (relType === 'ACTED_IN' && rel.roles) {
          const rolesArray = `[${rel.roles.map(r => `'${escapeCypherString(r || '')}'`).join(', ')}]`;
          propsStr = `{roles: ${rolesArray}}`;
        } else if (relType === 'REVIEWED') {
          const rating = parseInt(rel.rating) || 0;
          const summary = escapeCypherString(rel.summary || '');
          propsStr = `{summary: '${summary}', rating: ${rating}}`;
        }

        const query = `
          MATCH (a:Person {name: '${fromName}'}), (b:Movie {title: '${toName}'})
          CREATE (a)-[r:${relType} ${propsStr}]->(b)
        `;
        
        // Special case for FOLLOWS which connects Person to Person
        if (relType === 'FOLLOWS') {
          const followsQuery = `
            MATCH (a:Person {name: '${fromName}'}), (b:Person {name: '${toName}'})
            CREATE (a)-[r:FOLLOWS]->(b)
          `;
          await conn.query(followsQuery);
        } else {
          await conn.query(query);
        }
      }
    }

    console.log('\n=== Seed Complete ===');
    console.log(`Movies: ${MOVIES.length}`);
    console.log(`People: ${PEOPLE.length}`);
    for (const [type, rels] of Object.entries(RELATIONSHIPS)) {
      console.log(`${type}: ${rels.length}`);
    }

    // Verify relationships were created
    console.log('\n=== Verification ===');
    for (const [type, _] of Object.entries(RELATIONSHIPS)) {
      const result = await conn.query(`MATCH ()-[r:${type}]->() RETURN count(r) as count`);
      const rows = await result.getAll();
      const count = rows[0]?.count || 0;
      console.log(`${type} in database: ${count}`);
    }

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await db.close();
    console.log('\nDatabase closed.');
  }
}

// Run seeder if called directly
if (require.main === module) {
  const dbPath = process.argv[2] || path.join(__dirname, '..', 'movies.cgraph');
  seedDatabase(dbPath).catch(console.error);
}

module.exports = { seedDatabase };
