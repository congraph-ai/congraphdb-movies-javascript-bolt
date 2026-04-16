'use strict';

const express = require('express');
const path = require('path');
const { Database } = require('congraphdb');
const { createDbAdapter } = require('./lib/db-adapter');

const app = express();

const fs = require('fs');

// Load movie data from JSON file
const MOVIE_DATA_PATH = path.join(__dirname, 'scripts', 'movie_data.json');
let MOVIE_DATA = { MOVIES: [], PEOPLE: [], RELATIONSHIPS: {} };
if (fs.existsSync(MOVIE_DATA_PATH)) {
  MOVIE_DATA = JSON.parse(fs.readFileSync(MOVIE_DATA_PATH, 'utf8'));
}

async function seedDatabaseInline(adapter) {
  console.log('\nCreating movie nodes...');
  for (const movie of MOVIE_DATA.MOVIES) {
    await adapter.createNode('Movie', { ...movie, votes: 0 });
  }

  console.log('\nCreating person nodes...');
  for (const person of MOVIE_DATA.PEOPLE) {
    await adapter.createNode('Person', person);
  }

  console.log('\nCreating relationships...');
  for (const [relType, rels] of Object.entries(MOVIE_DATA.RELATIONSHIPS)) {
    if (rels.length === 0) continue;
    console.log(`  Adding ${rels.length} ${relType} relationships...`);
    
    for (const rel of rels) {
      if (!rel.from || !rel.to) continue;
      
      let propsStr = '';
      if (relType === 'ACTED_IN' && rel.roles) {
        propsStr = `{roles: [${rel.roles.map(r => `'${adapter.escapeCypher(r)}'`).join(', ')}]}`;
      } else if (relType === 'REVIEWED') {
        propsStr = `{summary: '${adapter.escapeCypher(rel.summary || '')}', rating: ${parseInt(rel.rating) || 0}}`;
      }

      const query = (relType === 'FOLLOWS') ?
        `MATCH (p1:Person {name: '${adapter.escapeCypher(rel.from)}'}), (p2:Person {name: '${adapter.escapeCypher(rel.to)}'}) CREATE (p1)-[:FOLLOWS]->(p2)` :
        `MATCH (p:Person {name: '${adapter.escapeCypher(rel.from)}'}), (m:Movie {title: '${adapter.escapeCypher(rel.to)}'}) CREATE (p)-[:${relType} ${propsStr}]->(m)`;
      
      await adapter.query(query);
    }
  }

  console.log('\n=== Seed Complete ===');
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
          
          for (const rel of outgoingEdges) {
            const relType = rel._type || rel.label || rel.relType || '';
            const targetMovie = rel.toNode || await adapter.getNodeByProperty('Movie', '_id', rel.to);
            
            if (targetMovie && targetMovie.title === title) {
              let job = 'acted';
              if (relType === 'DIRECTED') job = 'directed';
              if (relType === 'PRODUCED') job = 'produced';
              if (relType === 'WROTE') job = 'wrote';
              if (relType === 'REVIEWED') job = 'reviewed';

              cast.push({
                name: person.name,
                job: job,
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

          // Find all relationships to movies
          const outgoingEdges = await adapter.getOutgoingEdges('Person', 'name', person.name);
          for (const edge of outgoingEdges) {
            const targetMovie = edge.toNode || await adapter.getNodeByProperty('Movie', '_id', edge.to);
            if (targetMovie) {
              const target = movieIndexMap.get(targetMovie.title);
              if (target !== undefined) {
                rels.push({ source, target });
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
