/**
 * Database Adapter Tests
 *
 * Tests for the CongraphDB Database Adapter pattern (Cypher and JavaScript API modes)
 * Based on plan_03.md documentation
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Database } = require('congraphdb');
const { createDbAdapter, CypherAdapter, JavaScriptAPIAdapter } = require('../lib/db-adapter');

// Test database path
const TEST_DB_PATH = path.join(__dirname, 'test.cgraph');

// Test data
const TEST_MOVIE = {
  title: 'Test Movie',
  tagline: 'A test movie tagline',
  released: 2024,
  votes: 0
};

const TEST_PERSON = {
  name: 'Test Actor',
  born: 1990
};

const TEST_PERSON_2 = {
  name: 'Another Actor',
  born: 1985
};

describe('Database Adapter', () => {
  let db;
  let adapter;

  // Clean up test database before each test
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(TEST_DB_PATH + '.wal')) {
      fs.unlinkSync(TEST_DB_PATH + '.wal');
    }
  });

  afterEach(async () => {
    if (adapter) await adapter.close();
    if (db) await db.close();
  });

  describe('CypherAdapter', () => {
    beforeEach(async () => {
      db = new Database(TEST_DB_PATH);
      await db.init();
      adapter = new CypherAdapter(db);
      await adapter.init();
    });

    test('should create adapter with correct type', () => {
      expect(adapter).toBeInstanceOf(CypherAdapter);
    });

    test('should create a Movie node', async () => {
      const movie = await adapter.createNode('Movie', TEST_MOVIE);
      expect(movie).toBeDefined();
      expect(movie.title).toBe(TEST_MOVIE.title);
      expect(movie.tagline).toBe(TEST_MOVIE.tagline);
      expect(movie.released).toBe(TEST_MOVIE.released);
      expect(movie.votes).toBe(TEST_MOVIE.votes);
    });

    test('should create a Person node', async () => {
      const person = await adapter.createNode('Person', TEST_PERSON);
      expect(person).toBeDefined();
      expect(person.name).toBe(TEST_PERSON.name);
      expect(person.born).toBe(TEST_PERSON.born);
    });

    test('should get all nodes by label', async () => {
      await adapter.createNode('Movie', TEST_MOVIE);
      await adapter.createNode('Movie', { ...TEST_MOVIE, title: 'Another Movie' });

      const movies = await adapter.getNodesByLabel('Movie');
      expect(movies).toHaveLength(2);
      expect(movies[0].title).toBeDefined();
    });

    test('should get node by property', async () => {
      await adapter.createNode('Movie', TEST_MOVIE);

      const movie = await adapter.getNodeByProperty('Movie', 'title', TEST_MOVIE.title);
      expect(movie).toBeDefined();
      expect(movie.title).toBe(TEST_MOVIE.title);
    });

    test('should return null for non-existent node', async () => {
      const movie = await adapter.getNodeByProperty('Movie', 'title', 'Non-existent');
      expect(movie).toBeNull();
    });

    test('should update node by property', async () => {
      await adapter.createNode('Movie', TEST_MOVIE);

      const updated = await adapter.updateNodeByProperty('Movie', 'title', TEST_MOVIE.title, {
        votes: 5
      });

      expect(updated).toBeDefined();
      expect(updated.votes).toBe(5);
    });

    test('should create relationship between nodes', async () => {
      await adapter.createNode('Person', TEST_PERSON);
      await adapter.createNode('Movie', TEST_MOVIE);

      const query = `
        MATCH (p:Person {name: '${TEST_PERSON.name}'}), (m:Movie {title: '${TEST_MOVIE.title}'})
        CREATE (p)-[:ACTED_IN {roles: ['Lead Role']}]->(m)
        RETURN p, m
      `;

      const result = await adapter.query(query);
      const rows = await result.getAll();
      expect(rows.length).toBeGreaterThan(0);
    });

    test('should get outgoing edges for a node', async () => {
      await adapter.createNode('Person', TEST_PERSON);
      await adapter.createNode('Movie', TEST_MOVIE);

      // Create relationship
      await adapter.query(`
        MATCH (p:Person {name: '${TEST_PERSON.name}'}), (m:Movie {title: '${TEST_MOVIE.title}'})
        CREATE (p)-[:ACTED_IN {roles: ['Lead']}]->(m)
      `);

      const edges = await adapter.getOutgoingEdges('Person', 'name', TEST_PERSON.name);
      expect(edges.length).toBeGreaterThan(0);
      expect(edges[0]._type || edges[0].label).toBe('ACTED_IN');
    });

    test('should escape single quotes in property values', async () => {
      const movieWithQuote = await adapter.createNode('Movie', {
        title: "Movie's With Quotes",
        tagline: "It's a test"
      });

      expect(movieWithQuote).toBeDefined();
      expect(movieWithQuote.title).toBe("Movie's With Quotes");
    });

    test('should handle array properties', async () => {
      await adapter.createNode('Person', TEST_PERSON);
      await adapter.createNode('Movie', TEST_MOVIE);

      await adapter.query(`
        MATCH (p:Person {name: '${TEST_PERSON.name}'}), (m:Movie {title: '${TEST_MOVIE.title}'})
        CREATE (p)-[:ACTED_IN {roles: ['Role1', 'Role2', 'Role3']}]->(m)
      `);

      const edges = await adapter.getOutgoingEdges('Person', 'name', TEST_PERSON.name);
      expect(edges[0].roles).toEqual(['Role1', 'Role2', 'Role3']);
    });

    test('queryAll should return all results', async () => {
      await adapter.createNode('Movie', TEST_MOVIE);
      await adapter.createNode('Movie', { ...TEST_MOVIE, title: 'Movie 2' });
      await adapter.createNode('Movie', { ...TEST_MOVIE, title: 'Movie 3' });

      const movies = await adapter.queryAll('MATCH (m:Movie) RETURN m');
      expect(movies.length).toBe(3);
    });
  });

  describe('JavaScriptAPIAdapter', () => {
    beforeEach(async () => {
      db = new Database(TEST_DB_PATH);
      await db.init();
      adapter = new JavaScriptAPIAdapter(db);
      await adapter.init();
    });

    test('should create adapter with correct type', () => {
      expect(adapter).toBeInstanceOf(JavaScriptAPIAdapter);
    });

    test('should create a Movie node', async () => {
      const movie = await adapter.createNode('Movie', TEST_MOVIE);
      expect(movie).toBeDefined();
      expect(movie.title).toBe(TEST_MOVIE.title);
    });

    test('should create a Person node', async () => {
      const person = await adapter.createNode('Person', TEST_PERSON);
      expect(person).toBeDefined();
      expect(person.name).toBe(TEST_PERSON.name);
    });

    test('should get all nodes by label', async () => {
      await adapter.createNode('Movie', TEST_MOVIE);
      await adapter.createNode('Movie', { ...TEST_MOVIE, title: 'Another Movie' });

      const movies = await adapter.getNodesByLabel('Movie');
      expect(movies).toHaveLength(2);
    });

    test('should get node by property', async () => {
      await adapter.createNode('Movie', TEST_MOVIE);

      const movie = await adapter.getNodeByProperty('Movie', 'title', TEST_MOVIE.title);
      expect(movie).toBeDefined();
      expect(movie.title).toBe(TEST_MOVIE.title);
    });
  });

  describe('createDbAdapter factory', () => {
    beforeEach(async () => {
      db = new Database(TEST_DB_PATH);
      await db.init();
    });

    test('should create CypherAdapter for "cypher" mode', () => {
      adapter = createDbAdapter(db, 'cypher');
      expect(adapter).toBeInstanceOf(CypherAdapter);
    });

    test('should create CypherAdapter for "raw" mode', () => {
      adapter = createDbAdapter(db, 'raw');
      expect(adapter).toBeInstanceOf(CypherAdapter);
    });

    test('should create JavaScriptAPIAdapter for "javascript" mode', () => {
      adapter = createDbAdapter(db, 'javascript');
      expect(adapter).toBeInstanceOf(JavaScriptAPIAdapter);
    });

    test('should create JavaScriptAPIAdapter for "js" mode', () => {
      adapter = createDbAdapter(db, 'js');
      expect(adapter).toBeInstanceOf(JavaScriptAPIAdapter);
    });

    test('should create JavaScriptAPIAdapter for "api" mode', () => {
      adapter = createDbAdapter(db, 'api');
      expect(adapter).toBeInstanceOf(JavaScriptAPIAdapter);
    });

    test('should throw error for unknown mode', () => {
      expect(() => createDbAdapter(db, 'unknown')).toThrow('Unknown adapter mode');
    });

    test('should be case-insensitive for mode parameter', () => {
      const adapter1 = createDbAdapter(db, 'CYPHER');
      const adapter2 = createDbAdapter(db, 'JavaScript');
      expect(adapter1).toBeInstanceOf(CypherAdapter);
      expect(adapter2).toBeInstanceOf(JavaScriptAPIAdapter);
    });
  });
});
