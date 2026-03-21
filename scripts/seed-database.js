/**
 * CongraphDB Movies Database Seeder
 *
 * Initializes the CongraphDB with the sample movies dataset.
 * Uses raw Cypher queries for better compatibility.
 */

'use strict';

const { Database } = require('congraphdb');
const path = require('path');

// Movie data from the original in-memory store
const MOVIES = [
  { title: 'The Matrix', tagline: 'Welcome to the Real World', released: 1999 },
  { title: 'The Matrix Reloaded', tagline: 'Free your mind', released: 2003 },
  { title: 'The Matrix Revolutions', tagline: 'Everything that has a beginning has an end', released: 2003 },
  { title: 'The Devil\'s Advocate', tagline: 'Evil has its winning ways', released: 1997 },
  { title: 'The Da Vinci Code', tagline: 'Break the code', released: 2006 },
  { title: 'V for Vendetta', tagline: 'Freedom! Forever!', released: 2006 },
  { title: 'Speed Racer', tagline: 'Speed has no limits', released: 2008 },
  { title: 'Ninja Assassin', tagline: 'Prepare to enter a secret world of assassins', released: 2009 },
  { title: 'The Green Mile', tagline: 'Walking a mile in another man\'s shoes.', released: 1999 },
  { title: 'The Replacements', tagline: 'Pain heals, chicks dig scars, glory lasts forever', released: 2000 },
  { title: 'Top Gun', tagline: 'I feel the need, the need for speed', released: 1986 },
  { title: 'A Few Good Men', tagline: 'In the heart of the nation\'s capital, in a courthouse of the U.S. government, one man will stop at nothing to keep his honor, and one will stop at nothing to find the truth.', released: 1992 },
  { title: 'Jerry Maguire', tagline: 'The rest of his life begins now.', released: 1996 },
  { title: 'Stand By Me', tagline: 'For some, it\'s the last real taste of innocence, and the first real taste of life.', released: 1986 },
  { title: 'As Good as It Gets', tagline: 'A comedy from the heart that goes for the throat.', released: 1997 },
  { title: 'What Dreams May Come', tagline: 'After death there is life.', released: 1998 },
  { title: 'Snow Falling on Cedars', tagline: 'First loves last. True loves never die.', released: 1999 },
];

const PEOPLE = [
  { name: 'Keanu Reeves', born: 1964 },
  { name: 'Carrie-Anne Moss', born: 1967 },
  { name: 'Laurence Fishburne', born: 1961 },
  { name: 'Hugo Weaving', born: 1960 },
  { name: 'Lana Wachowski', born: 1965 },
  { name: 'Lilly Wachowski', born: 1967 },
  { name: 'Joel Silver', born: 1952 },
  { name: 'Tom Hanks', born: 1956 },
  { name: 'Al Pacino', born: 1940 },
  { name: 'Charlize Theron', born: 1975 },
  { name: 'Gene Hackman', born: 1930 },
  { name: 'Tom Cruise', born: 1962 },
  { name: 'Meg Ryan', born: 1961 },
  { name: 'Jack Nicholson', born: 1937 },
];

const ACTED_IN_RELATIONSHIPS = [
  { from: 'Keanu Reeves', to: 'The Matrix', roles: ['Neo'] },
  { from: 'Keanu Reeves', to: 'The Matrix Reloaded', roles: ['Neo'] },
  { from: 'Keanu Reeves', to: 'The Matrix Revolutions', roles: ['Neo'] },
  { from: 'Keanu Reeves', to: 'The Devil\'s Advocate', roles: ['Kevin Lomax'] },
  { from: 'Carrie-Anne Moss', to: 'The Matrix', roles: ['Trinity'] },
  { from: 'Carrie-Anne Moss', to: 'The Matrix Reloaded', roles: ['Trinity'] },
  { from: 'Carrie-Anne Moss', to: 'The Matrix Revolutions', roles: ['Trinity'] },
  { from: 'Laurence Fishburne', to: 'The Matrix', roles: ['Morpheus'] },
  { from: 'Laurence Fishburne', to: 'The Matrix Reloaded', roles: ['Morpheus'] },
  { from: 'Laurence Fishburne', to: 'The Matrix Revolutions', roles: ['Morpheus'] },
  { from: 'Hugo Weaving', to: 'The Matrix', roles: ['Agent Smith'] },
  { from: 'Hugo Weaving', to: 'The Matrix Reloaded', roles: ['Agent Smith'] },
  { from: 'Hugo Weaving', to: 'The Matrix Revolutions', roles: ['Agent Smith'] },
  { from: 'Hugo Weaving', to: 'V for Vendetta', roles: ['V'] },
  { from: 'Tom Hanks', to: 'The Green Mile', roles: ['Paul Edgecomb'] },
  { from: 'Tom Hanks', to: 'The Da Vinci Code', roles: ['Robert Langdon'] },
  { from: 'Al Pacino', to: 'The Devil\'s Advocate', roles: ['John Milton'] },
];

// Helper function to escape single quotes in Cypher strings
function escapeCypherString(str) {
  return str.replace(/'/g, "\\'");
}

async function seedDatabase(dbPath = './movies.cgraph') {
  console.log('Seeding CongraphDB with movies dataset...');
  console.log(`Database path: ${dbPath}`);

  // Initialize database
  const db = new Database(dbPath);
  await db.init();
  const conn = db.createConnection();

  try {
    // Check if data already exists
    const checkResult = await conn.query("MATCH (m:Movie) RETURN count(*) AS count");
    const checkRows = await checkResult.getAll();
    const count = checkRows[0]?.count || 0;

    if (count > 0) {
      console.log(`Database already contains ${count} movies. Skipping seed.`);
      await db.close();
      return;
    }

    // Create movie nodes
    console.log('\nCreating movie nodes...');
    for (const movie of MOVIES) {
      const tagline = escapeCypherString(movie.tagline);
      const title = escapeCypherString(movie.title);
      const query = `CREATE (m:Movie {title: '${title}', tagline: '${tagline}', released: ${movie.released}, votes: 0})`;
      await conn.query(query);
      console.log(`  Created: ${movie.title}`);
    }

    // Create person nodes
    console.log('\nCreating person nodes...');
    for (const person of PEOPLE) {
      const name = escapeCypherString(person.name);
      const query = `CREATE (p:Person {name: '${name}', born: ${person.born}})`;
      await conn.query(query);
      console.log(`  Created: ${person.name}`);
    }

    // Create ACTED_IN relationships
    console.log('\nCreating ACTED_IN relationships...');
    for (const rel of ACTED_IN_RELATIONSHIPS) {
      const fromName = escapeCypherString(rel.from);
      const toTitle = escapeCypherString(rel.to);
      const rolesArray = `[${rel.roles.map(r => `'${escapeCypherString(r)}'`).join(', ')}]`;
      const query = `
        MATCH (p:Person {name: '${fromName}'}), (m:Movie {title: '${toTitle}'})
        CREATE (p)-[r:ACTED_IN {roles: ${rolesArray}}]->(m)
      `;
      await conn.query(query);
      console.log(`  ${rel.from} -[ACTED_IN]-> ${rel.to}`);
    }

    console.log('\n=== Seed Complete ===');
    console.log(`Movies: ${MOVIES.length}`);
    console.log(`People: ${PEOPLE.length}`);
    console.log(`Relationships: ${ACTED_IN_RELATIONSHIPS.length}`);

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
