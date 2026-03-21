'use strict';

const express = require('express');
const path = require('path');
const { Database } = require('congraphdb');
const { createDbAdapter } = require('./lib/db-adapter');

const app = express();

// Movie data for inline seeding
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

async function seedDatabaseInline(adapter) {
  console.log('\nCreating movie nodes...');
  for (const movie of MOVIES) {
    await adapter.createNode('Movie', { ...movie, votes: 0 });
    console.log(`  Created: ${movie.title}`);
  }

  console.log('\nCreating person nodes...');
  for (const person of PEOPLE) {
    await adapter.createNode('Person', person);
    console.log(`  Created: ${person.name}`);
  }

  console.log('\nCreating ACTED_IN relationships...');
  for (const rel of ACTED_IN_RELATIONSHIPS) {
    const personNode = await adapter.getNodeByProperty('Person', 'name', rel.from);
    const movieNode = await adapter.getNodeByProperty('Movie', 'title', rel.to);
    if (personNode && movieNode) {
      await adapter.query(`
        MATCH (p:Person {name: '${adapter.escapeCypher(rel.from)}'}), (m:Movie {title: '${adapter.escapeCypher(rel.to)}'})
        CREATE (p)-[r:ACTED_IN {roles: [${rel.roles.map(r => `'${adapter.escapeCypher(r)}'`).join(', ')}]}]->(m)
      `);
      console.log(`  ${rel.from} -[ACTED_IN]-> ${rel.to}`);
    }
  }

  console.log('\n=== Seed Complete ===');
  console.log(`Movies: ${MOVIES.length}`);
  console.log(`People: ${PEOPLE.length}`);
  console.log(`Relationships: ${ACTED_IN_RELATIONSHIPS.length}\n`);
}
const PORT = 3505;

// CongraphDB Configuration
// Set CONGRAPHDB_API_MODE environment variable to 'cypher' or 'javascript'
// Default: 'cypher' (JavaScript API has node ID handling issues in v0.1.6)
const API_MODE = process.env.CONGRAPHDB_API_MODE || 'cypher';
const DB_PATH = path.join(__dirname, 'movies.cgraph');

let db;
let adapter;

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing CongraphDB...');
    console.log(`API Mode: ${API_MODE.toUpperCase()}`);

    // Initialize database
    db = new Database(DB_PATH);
    await db.init();

    // Create adapter based on mode
    adapter = createDbAdapter(db, API_MODE);
    await adapter.init();

    // Check if database has data
    const movies = await adapter.getNodesByLabel('Movie');
    const movieCount = movies.length;

    if (movieCount === 0) {
      console.log('Database is empty. Auto-seeding...');
      // Seed using the existing connection to avoid CongraphDB persistence bug
      await seedDatabaseInline(adapter);
      const moviesAfter = await adapter.getNodesByLabel('Movie');
      console.log(`Database seeded with ${moviesAfter.length} movies.`);
    } else {
      console.log(`Database loaded with ${movieCount} movies.`);
    }

    // Middleware
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'build')));

    // API Routes

    // Search movies
    app.get('/api/movies/search', async (req, res) => {
      try {
        const title = req.query.title || '';
        const movies = await adapter.getNodesByLabel('Movie');
        const results = movies.filter(m =>
          m.title.toLowerCase().includes(title.toLowerCase())
        );
        res.json(results);
      } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get movie details
    app.get('/api/movies/:title', async (req, res) => {
      try {
        const title = decodeURIComponent(req.params.title);
        const movie = await adapter.getNodeByProperty('Movie', 'title', title);

        if (!movie) {
          return res.status(404).json({ error: 'Movie not found' });
        }

        // Find people who acted in this movie
        const people = await adapter.getNodesByLabel('Person');
        const cast = [];

        for (const person of people) {
          const outgoingEdges = await adapter.getOutgoingEdges('Person', 'name', person.name);
          const actedInRels = outgoingEdges.filter(e => e._type === 'ACTED_IN' || e.label === 'ACTED_IN');

          for (const rel of actedInRels) {
            const targetMovie = rel.toNode || await adapter.getNodeByProperty('Movie', '_id', rel.to);
            if (targetMovie && targetMovie.title === title) {
              cast.push({
                name: person.name,
                job: 'acted',
                role: rel.roles && rel.roles.length > 0 ? rel.roles[0] : ''
              });
            }
          }
        }

        res.json({
          title: movie.title,
          tagline: movie.tagline,
          released: movie.released,
          votes: movie.votes || 0,
          cast
        });
      } catch (error) {
        console.error('Get movie error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Vote for movie
    app.post('/api/movies/:title/vote', async (req, res) => {
      try {
        const title = decodeURIComponent(req.params.title);
        await adapter.updateNodeByProperty('Movie', 'title', title, {
          votes: (await adapter.getNodeByProperty('Movie', 'title', title))?.votes + 1 || 1
        });
        res.json({ success: true });
      } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get graph data for D3 visualization
    app.get('/api/graph', async (req, res) => {
      try {
        const movies = await adapter.getNodesByLabel('Movie');
        const people = await adapter.getNodesByLabel('Person');

        const nodes = [];
        const rels = [];
        const movieIndexMap = new Map();
        const personIndexMap = new Map();
        let i = 0;

        // Add movie nodes
        for (const movie of movies) {
          nodes.push({ title: movie.title, label: 'movie' });
          movieIndexMap.set(movie.title, i);
          i++;
        }

        // Add person nodes and relationships
        for (const person of people) {
          let source = nodes.findIndex(n => n.title === person.name);
          if (source === -1) {
            nodes.push({ title: person.name, label: 'actor' });
            source = i;
            personIndexMap.set(person.name, i);
            i++;
          } else {
            personIndexMap.set(person.name, source);
          }

          // Find ACTED_IN relationships
          const outgoingEdges = await adapter.getOutgoingEdges('Person', 'name', person.name);
          for (const edge of outgoingEdges) {
            const relType = edge._type || edge.label || edge.relType;
            if (relType === 'ACTED_IN') {
              const targetMovie = edge.toNode || await adapter.getNodeByProperty('Movie', '_id', edge.to);
              if (targetMovie) {
                const target = movieIndexMap.get(targetMovie.title);
                if (target !== undefined) {
                  rels.push({ source, target });
                }
              }
            }
          }
        }

        res.json({ nodes, links: rels });
      } catch (error) {
        console.error('Graph error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      if (adapter) await adapter.close();
      if (db) await db.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Database: ${DB_PATH}`);
      console.log(`API Mode: ${API_MODE}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
