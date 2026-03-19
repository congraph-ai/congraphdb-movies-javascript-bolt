/**
 * CongraphDB Movies Database Seeder
 *
 * Initializes the CongraphDB with the sample movies dataset.
 */

'use strict';

const { Database, CongraphDBAPI } = require('congraphdb');
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

async function seedDatabase(dbPath = './movies.cgraph') {
  console.log('Seeding CongraphDB with movies dataset...');
  console.log(`Database path: ${dbPath}`);

  // Initialize database
  const db = new Database(dbPath);
  await db.init();
  const api = new CongraphDBAPI(db);

  try {
    // Check if data already exists
    const existingMovies = await api.getNodesByLabel('Movie');
    if (existingMovies.length > 0) {
      console.log(`Database already contains ${existingMovies.length} movies. Skipping seed.`);
      await api.close();
      await db.close();
      return;
    }

    // Create movie nodes
    console.log('\nCreating movie nodes...');
    const movieMap = new Map();
    for (const movie of MOVIES) {
      const node = await api.createNode('Movie', {
        title: movie.title,
        tagline: movie.tagline,
        released: movie.released,
        votes: 0
      });
      movieMap.set(movie.title, node._id);
      console.log(`  Created: ${movie.title}`);
    }

    // Create person nodes
    console.log('\nCreating person nodes...');
    const personMap = new Map();
    for (const person of PEOPLE) {
      const node = await api.createNode('Person', {
        name: person.name,
        born: person.born
      });
      personMap.set(person.name, node._id);
      console.log(`  Created: ${person.name}`);
    }

    // Create ACTED_IN relationships
    console.log('\nCreating ACTED_IN relationships...');
    for (const rel of ACTED_IN_RELATIONSHIPS) {
      const personId = personMap.get(rel.from);
      const movieId = movieMap.get(rel.to);
      if (personId && movieId) {
        await api.createEdge(personId, 'ACTED_IN', movieId, {
          roles: rel.roles
        });
        console.log(`  ${rel.from} -[ACTED_IN]-> ${rel.to}`);
      }
    }

    console.log('\n=== Seed Complete ===');
    console.log(`Movies: ${movieMap.size}`);
    console.log(`People: ${personMap.size}`);
    console.log(`Relationships: ${ACTED_IN_RELATIONSHIPS.length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await api.close();
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
