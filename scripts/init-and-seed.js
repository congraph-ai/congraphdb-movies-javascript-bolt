/**
 * Initialize database and seed data using property graph mode
 * CongraphDB uses property graph mode (not table-based)
 */

const { Database } = require('congraphdb');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'movies.cgraph');

// Sample movie data
const movies = [
  { title: 'The Matrix', tagline: 'Welcome to the Real World', released: 1999, votes: 0 },
  { title: 'The Matrix Reloaded', tagline: 'Free your mind', released: 2003, votes: 0 },
  { title: 'The Matrix Revolutions', tagline: 'Everything that has a beginning has an end', released: 2003, votes: 0 },
  { title: 'The Devil\'s Advocate', tagline: 'Evil has its winning ways', released: 1997, votes: 0 },
  { title: 'The Da Vinci Code', tagline: 'Break the code', released: 2006, votes: 0 },
  { title: 'V for Vendetta', tagline: 'Freedom! Forever!', released: 2006, votes: 0 },
  { title: 'Speed Racer', tagline: 'Speed has no limits', released: 2008, votes: 0 },
  { title: 'Ninja Assassin', tagline: 'Prepare to enter a secret world of assassins', released: 2009, votes: 0 },
  { title: 'The Green Mile', tagline: 'Walking a mile in another man\'s shoes.', released: 1999, votes: 0 },
  { title: 'The Replacements', tagline: 'Pain heals, chicks dig scars, glory lasts forever', released: 2000, votes: 0 },
  { title: 'Top Gun', tagline: 'I feel the need, the need for speed', released: 1986, votes: 0 },
  { title: 'A Few Good Men', tagline: 'In the heart of the nation\'s capital, in a courthouse of the U.S. government, one man will stop at nothing to keep his honor, and one will stop at nothing to find the truth.', released: 1992, votes: 0 },
  { title: 'Jerry Maguire', tagline: 'The rest of his life begins now.', released: 1996, votes: 0 },
  { title: 'Stand By Me', tagline: 'For some, it\'s the last real taste of innocence, and the first real taste of life.', released: 1986, votes: 0 },
  { title: 'As Good as It Gets', tagline: 'A comedy from the heart that goes for the throat.', released: 1997, votes: 0 },
  { title: 'What Dreams May Come', tagline: 'After death there is life.', released: 1998, votes: 0 },
  { title: 'Snow Falling on Cedars', tagline: 'First loves last. True loves never die.', released: 1999, votes: 0 },
];

const people = [
  { name: 'Keanu Reeves', born: 1964 },
  { name: 'Carrie-Anne Moss', born: 1967 },
  { name: 'Laurence Fishburne', born: 1961 },
  { name: 'Hugo Weaving', born: 1960 },
  { name: 'Lana Wachowski', born: 1965 },
  { name: 'Lilly Wachowski', born: 1967 },
  { name: 'Joel Silver', born: 1952 },
  { name: 'Al Pacino', born: 1940 },
  { name: 'Charlize Theron', born: 1975 },
  { name: 'Tom Hanks', born: 1956 },
  { name: 'Michael Clarke Duncan', born: 1957 },
  { name: 'Frank Darabont', born: 1959 },
  { name: 'Gene Hackman', born: 1930 },
  { name: 'Orlando Jones', born: 1968 },
  { name: 'Howard Deutch', born: 1950 },
  { name: 'Tom Cruise', born: 1962 },
  { name: 'Kelly McGillis', born: 1957 },
  { name: 'Val Kilmer', born: 1959 },
  { name: 'Anthony Edwards', born: 1962 },
  { name: 'Tom Skerritt', born: 1933 },
  { name: 'Meg Ryan', born: 1961 },
  { name: 'Jack Nicholson', born: 1937 },
  { name: 'Demi Moore', born: 1962 },
  { name: 'Kevin Bacon', born: 1958 },
  { name: 'Kevin Pollak', born: 1957 },
  { name: 'James Marshall', born: 1967 },
  { name: 'J.T. Walsh', born: 1943 },
  { name: 'Rob Reiner', born: 1947 },
  { name: 'Aaron Sorkin', born: 1961 },
  { name: 'William H. Macy', born: 1950 },
  { name: 'Rita Wilson', born: 1956 },
  { name: 'Jonathan Lipnicki', born: 1996 },
  { name: 'Cuba Gooding Jr.', born: 1968 },
  { name: 'Renée Zellweger', born: 1969 },
  { name: 'Kelly Preston', born: 1962 },
  { name: 'Jerry O\'Connell', born: 1974 },
  { name: 'Jay Mohr', born: 1970 },
  { name: 'Bonnie Hunt', born: 1961 },
  { name: 'Regina King', born: 1970 },
  { name: 'Cameron Crowe', born: 1957 },
  { name: 'River Phoenix', born: 1970 },
  { name: 'Corey Feldman', born: 1971 },
  { name: 'Wil Wheaton', born: 1972 },
  { name: 'John Cusack', born: 1966 },
  { name: 'Marshall Bell', born: 1942 },
  { name: 'Liev Schreiber', born: 1967 },
  { name: 'Helen Hunt', born: 1963 },
  { name: 'Greg Kinnear', born: 1963 },
  { name: 'James L. Brooks', born: 1940 },
  { name: 'Robin Williams', born: 1951 },
  { name: 'Annabella Sciorra', born: 1960 },
  { name: 'Max von Sydow', born: 1929 },
  { name: 'Rosalind Chao', born: 1957 },
];

const actedIn = [
  { from: 'Keanu Reeves', to: 'The Matrix', roles: ['Neo'] },
  { from: 'Keanu Reeves', to: 'The Matrix Reloaded', roles: ['Neo'] },
  { from: 'Keanu Reeves', to: 'The Matrix Revolutions', roles: ['Neo'] },
  { from: 'Keanu Reeves', to: 'The Devil\'s Advocate', roles: ['Kevin Lomax'] },
  { from: 'Keanu Reeves', to: 'The Replacements', roles: ['Shane Falco'] },
  { from: 'Keanu Reeves', to: 'Speed Racer', roles: ['Speed Racer'] },
  { from: 'Keanu Reeves', to: 'Ninja Assassin', roles: [] },
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
];

async function initAndSeed() {
  console.log(`Initializing database at: ${dbPath}`);

  const db = new Database(dbPath);
  await db.init();
  const conn = db.createConnection();

  // Use property graph mode - no table creation needed
  console.log('Seeding data in property graph mode...');

  // Insert movies
  console.log('Inserting movies...');
  for (const movie of movies) {
    await conn.query(
      'CREATE (m:Movie {title: $title, tagline: $tagline, released: $released, votes: $votes})',
      movie
    );
  }
  console.log(`  - Inserted ${movies.length} movies`);

  // Insert people
  console.log('Inserting people...');
  for (const person of people) {
    await conn.query(
      'CREATE (p:Person {name: $name, born: $born})',
      person
    );
  }
  console.log(`  - Inserted ${people.length} people`);

  // Insert relationships
  console.log('Inserting ACTED_IN relationships...');
  let count = 0;
  for (const rel of actedIn) {
    await conn.query(
      `MATCH (p:Person {name: $from}), (m:Movie {title: $to})
       CREATE (p)-[:ACTED_IN {roles: $roles}]->(m)`,
      { from: rel.from, to: rel.to, roles: rel.roles }
    );
    count++;
  }
  console.log(`  - Inserted ${count} ACTED_IN relationships`);

  // Verify data
  console.log('Verifying data...');
  const result = await conn.query('MATCH (m:Movie) RETURN m.title LIMIT 5');
  const rows = result.getAll();
  console.log('  - Sample movies:', rows);

  console.log('\nDatabase initialized and seeded successfully!');
  console.log('You can now run: npm start');

  await db.close();
}

// Run
initAndSeed().catch(err => {
  console.error('Error:', err.message);
  console.error('Details:', err);
  process.exit(1);
});
