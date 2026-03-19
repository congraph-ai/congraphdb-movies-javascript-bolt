'use strict';

const express = require('express');
const path = require('path');
const { Database, CongraphDBAPI } = require('congraphdb');

const app = express();
const PORT = 3500;

// CongraphDB - Persistent graph database (persistence issues fixed in v0.1.6)
const DB_PATH = path.join(__dirname, 'movies.cgraph');
let db;
let api;

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing CongraphDB...');

    // Initialize database
    db = new Database(DB_PATH);
    await db.init();
    api = new CongraphDBAPI(db);

    // Check if database has data
    const movies = await api.getNodesByLabel('Movie');
    if (movies.length === 0) {
      console.log('Database is empty. Please run: node scripts/seed-database.js');
      console.log('Starting server anyway (will have empty data)...');
    } else {
      console.log(`Database loaded with ${movies.length} movies.`);
    }

    // Middleware
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'build')));

    // API Routes

    // Search movies
    app.get('/api/movies/search', async (req, res) => {
      try {
        const title = req.query.title || '';
        const movies = await api.getNodesByLabel('Movie');
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
        const movies = await api.getNodesByLabel('Movie');
        const movie = movies.find(m => m.title === title);

        if (!movie) {
          return res.status(404).json({ error: 'Movie not found' });
        }

        // Find people who acted in this movie
        const people = await api.getNodesByLabel('Person');
        const cast = [];

        for (const person of people) {
          const outgoingEdges = await api.getOutgoing(person._id);
          const actedInRels = outgoingEdges.filter(e => e.label === 'ACTED_IN');

          for (const rel of actedInRels) {
            const targetMovie = await api.getNode(rel.to);
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
        const movies = await api.getNodesByLabel('Movie');
        const movieNode = movies.find(m => m.title === title);

        if (movieNode) {
          const currentVotes = movieNode.votes || 0;
          await api.updateNode(movieNode._id, { votes: currentVotes + 1 });
        }

        res.json({ success: true });
      } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get graph data for D3 visualization
    app.get('/api/graph', async (req, res) => {
      try {
        const movies = await api.getNodesByLabel('Movie');
        const people = await api.getNodesByLabel('Person');

        const nodes = [];
        const rels = [];
        const movieIndexMap = new Map();
        let i = 0;

        // Add movie nodes
        for (const movie of movies) {
          nodes.push({ title: movie.title, label: 'movie' });
          movieIndexMap.set(movie._id, i);
          i++;
        }

        // Add person nodes and relationships
        const personIndexMap = new Map();
        for (const person of people) {
          let source = nodes.findIndex(n => n.title === person.name);
          if (source === -1) {
            nodes.push({ title: person.name, label: 'actor' });
            source = i;
            personIndexMap.set(person._id, i);
            i++;
          } else {
            personIndexMap.set(person._id, source);
          }

          // Find ACTED_IN relationships
          const outgoingEdges = await api.getOutgoing(person._id);
          for (const edge of outgoingEdges) {
            if (edge.label === 'ACTED_IN') {
              const target = movieIndexMap.get(edge.to);
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
      if (api) await api.close();
      if (db) await db.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Database: ${DB_PATH}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
