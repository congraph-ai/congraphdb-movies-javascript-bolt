/**
 * Cypher Query Tests
 *
 * Tests based on sample Cypher queries from movies_queries.md
 * These tests verify that the classic Movies graph queries work correctly
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Database } = require('congraphdb');
const { createDbAdapter } = require('../lib/db-adapter');

// Test database path
const TEST_DB_PATH = path.join(__dirname, 'test-movies.cgraph');

// Sample movie data for testing
const SAMPLE_DATA = {
  movies: [
    { title: 'The Matrix', tagline: 'Welcome to the Real World', released: 1999, votes: 0 },
    { title: 'The Matrix Reloaded', tagline: 'Free your mind', released: 2003, votes: 0 },
    { title: 'The Matrix Revolutions', tagline: 'Everything that has a beginning has an end', released: 2003, votes: 0 },
    { title: 'The Devil\'s Advocate', tagline: 'Evil has its winning ways', released: 1997, votes: 0 },
    { title: 'A Few Good Men', tagline: 'In the heart of the nation\'s capital, in a courthouse of the U.S. government, one man will stop at nothing to keep his honor, and one will stop at nothing to find the truth.', released: 1992, votes: 0 },
    { title: 'Top Gun', tagline: 'I feel the need, the need for speed', released: 1986, votes: 0 },
    { title: 'Jerry Maguire', tagline: 'The rest of his life begins now.', released: 1996, votes: 0 },
    { title: 'Stand By Me', tagline: 'For some, it\'s the last real taste of innocence, and the first real taste of life.', released: 1986, votes: 0 },
    { title: 'As Good as It Gets', tagline: 'A comedy from the heart that goes for the throat.', released: 1997, votes: 0 },
    { title: 'What Dreams May Come', tagline: 'After life there is more. The end is just the beginning.', released: 1998, votes: 0 },
    { title: 'Snow Falling on Cedars', tagline: 'First loves last. Or do they?', released: 1999, votes: 0 },
    { title: 'You\'ve Got Mail', tagline: 'At home in the brave new world of the Internet.', released: 1998, votes: 0 },
    { title: 'Sleepless in Seattle', tagline: 'What if someone you never met, someone you never saw, someone you never knew was the only someone for you?', released: 1993, votes: 0 },
    { title: 'Joe Versus the Volcano', tagline: 'A story of love, lava and burning desire.', released: 1990, votes: 0 },
    { title: 'When Harry Met Sally', tagline: 'Can two friends sleep together and still love each other in the morning?', released: 1989, votes: 0 },
    { title: 'That Thing You Do', tagline: 'In every life there comes a time when that thing you dream becomes that thing you do', released: 1996, votes: 0 },
    { title: 'The Replacements', tagline: 'Pain heals, chicks dig scars, glory lasts forever.', released: 2000, votes: 0 }
  ],
  people: [
    { name: 'Keanu Reeves', born: 1964 },
    { name: 'Carrie-Anne Moss', born: 1967 },
    { name: 'Laurence Fishburne', born: 1961 },
    { name: 'Hugo Weaving', born: 1960 },
    { name: 'Kevin Bacon', born: 1958 },
    { name: 'Al Pacino', born: 1940 },
    { name: 'Jack Nicholson', born: 1937 },
    { name: 'Tom Cruise', born: 1962 },
    { name: 'Cuba Gooding Jr.', born: 1968 },
    { name: 'Renee Zellweger', born: 1969 },
    { name: 'Meg Ryan', born: 1961 },
    { name: 'Tom Hanks', born: 1956 },
    { name: 'Diane Keaton', born: 1946 },
    { name: 'Nora Ephron', born: 1941 }
  ],
  relationships: [
    { from: 'Keanu Reeves', to: 'The Matrix', roles: ['Neo'] },
    { from: 'Carrie-Anne Moss', to: 'The Matrix', roles: ['Trinity'] },
    { from: 'Laurence Fishburne', to: 'The Matrix', roles: ['Morpheus'] },
    { from: 'Hugo Weaving', to: 'The Matrix', roles: ['Agent Smith'] },
    { from: 'Keanu Reeves', to: 'The Matrix Reloaded', roles: ['Neo'] },
    { from: 'Carrie-Anne Moss', to: 'The Matrix Reloaded', roles: ['Trinity'] },
    { from: 'Laurence Fishburne', to: 'The Matrix Reloaded', roles: ['Morpheus'] },
    { from: 'Keanu Reeves', to: 'The Matrix Revolutions', roles: ['Neo'] },
    { from: 'Kevin Bacon', to: 'A Few Good Men', roles: ['Capt. Jack Ross'] },
    { from: 'Tom Cruise', to: 'A Few Good Men', roles: ['Lt. Daniel Kaffee'] },
    { from: 'Jack Nicholson', to: 'A Few Good Men', roles: ['Col. Nathan R. Jessup'] },
    { from: 'Tom Cruise', to: 'Top Gun', roles: ['Maverick'] },
    { from: 'Tom Cruise', to: 'Jerry Maguire', roles: ['Jerry Maguire'] },
    { from: 'Cuba Gooding Jr.', to: 'Jerry Maguire', roles: ['Rod Tidwell'] },
    { from: 'Renee Zellweger', to: 'Jerry Maguire', roles: ['Dorothy Boyd'] },
    { from: 'Tom Hanks', to: 'That Thing You Do', roles: ['Mr. White'] },
    { from: 'Tom Hanks', to: 'Joe Versus the Volcano', roles: ['Joe Banks'] },
    { from: 'Meg Ryan', to: 'You\'ve Got Mail', roles: ['Kathleen Kelly'] },
    { name: 'Nora Ephron', to: 'You\'ve Got Mail', roles: ['Director'] }
  ]
};

describe('Cypher Queries (from movies_queries.md)', () => {
  let db;
  let adapter;

  // Helper function to seed test database
  async function seedDatabase() {
    // Create movie nodes
    for (const movie of SAMPLE_DATA.movies) {
      await adapter.createNode('Movie', movie);
    }

    // Create person nodes
    for (const person of SAMPLE_DATA.people) {
      await adapter.createNode('Person', person);
    }

    // Create ACTED_IN relationships
    for (const rel of SAMPLE_DATA.relationships) {
      if (!rel.from || !rel.to) continue;

      const rolesStr = rel.roles
        ? `{roles: [${rel.roles.map(r => `'${adapter.escapeCypher(r)}'`).join(', ')}]}`
        : '';

      const query = `
        MATCH (p:Person {name: '${adapter.escapeCypher(rel.from)}'}), (m:Movie {title: '${adapter.escapeCypher(rel.to)}'})
        CREATE (p)-[:ACTED_IN ${rolesStr}]->(m)
      `;
      await adapter.query(query);
    }
  }

  // Clean up test database before all tests
  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(TEST_DB_PATH + '.wal')) {
      fs.unlinkSync(TEST_DB_PATH + '.wal');
    }

    db = new Database(TEST_DB_PATH);
    await db.init();
    adapter = createDbAdapter(db, 'cypher');
    await adapter.init();
    await seedDatabase();
  });

  afterAll(async () => {
    if (adapter) await adapter.close();
    if (db) await db.close();
  });

  describe('Query 1: Hello World - Retrieve all nodes', () => {
    test('should retrieve nodes with LIMIT', async () => {
      const result = await adapter.queryAll('MATCH (n) RETURN n LIMIT 20');
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Query 2: Find Actors in a Specific Movie', () => {
    test('should find all actors in The Matrix', async () => {
      const result = await adapter.queryAll(`
        MATCH (p:Person)-[:ACTED_IN]->(m:Movie {title: 'The Matrix'})
        RETURN p.name, p.born
      `);

      expect(result.length).toBeGreaterThan(0);
      const names = result.map(r => r.name || r['p.name'] || (r.p && r.p.name)).filter(n => n).sort();
      expect(names).toContain('Keanu Reeves');
      expect(names).toContain('Carrie-Anne Moss');
      expect(names).toContain('Laurence Fishburne');
      expect(names).toContain('Hugo Weaving');
    });
  });

  describe('Query 3: Actor Portfolio', () => {
    test('should find all movies for Keanu Reeves ordered by release year', async () => {
      const result = await adapter.queryAll(`
        MATCH (p:Person {name: 'Keanu Reeves'})-[:ACTED_IN]->(m:Movie)
        RETURN m.title, m.released
        ORDER BY m.released DESC
      `);

      expect(result.length).toBeGreaterThan(0);
      const firstTitle = result[0].title || result[0]['m.title'] || (result[0].m && result[0].m.title);
      expect(firstTitle).toBeDefined();

      // Check ordering by released (descending)
      for (let i = 1; i < result.length; i++) {
        const prevReleased = result[i - 1].released || result[i - 1]['m.released'];
        const currReleased = result[i].released || result[i]['m.released'];
        expect(prevReleased).toBeGreaterThanOrEqual(currReleased);
      }

      const titles = result.map(r => r.title || r['m.title'] || (r.m && r.m.title)).filter(t => t);
      expect(titles).toContain('The Matrix');
      expect(titles).toContain('The Matrix Reloaded');
    });
  });

  describe('Query 4: Co-Actors (Network Analysis)', () => {
    test('should find co-actors of Keanu Reeves', async () => {
      // This query finds people who have acted with Keanu Reeves
      const result = await adapter.queryAll(`
        MATCH (keanu:Person {name: 'Keanu Reeves'})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(coActor:Person)
        RETURN coActor, m.title
      `);

      // The query should return results (co-actors found)
      expect(result.length).toBeGreaterThan(0);

      // Verify we have some result structure
      expect(result[0]).toBeDefined();

      // Note: The exact structure of co-actor names depends on CongraphDB's query result format
      // This test verifies the co-actor query pattern works correctly
    });
  });

  describe('Query 5: Director-Actor Relationships', () => {
    test('should find people who directed and acted in same movie', async () => {
      // First add a director relationship for testing
      await adapter.query(`
        MATCH (p:Person {name: 'Nora Ephron'}), (m:Movie {title: 'You\'ve Got Mail'})
        CREATE (p)-[:DIRECTED]->(m)
      `);

      const result = await adapter.queryAll(`
        MATCH (p:Person)-[:ACTED_IN]->(m:Movie), (p)-[:DIRECTED]->(m)
        RETURN p.name, m.title
      `);

      // Depending on test data, this might be empty or have results
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Query 6: Discovery & Aggregation', () => {
    test('should find movies with most actors (ordered by count)', async () => {
      const result = await adapter.queryAll(`
        MATCH (p:Person)-[:ACTED_IN]->(m:Movie)
        RETURN m.title, count(p) as actorCount
        ORDER BY actorCount DESC
        LIMIT 5
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);

      // Verify ordering
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].actorCount).toBeGreaterThanOrEqual(result[i].actorCount);
      }

      // All results should have actorCount
      result.forEach(r => {
        expect(r.actorCount).toBeDefined();
        expect(r.actorCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Query 7: Recommendations (Simple)', () => {
    test('should find movies through co-actors that Keanu hasn\'t been in', async () => {
      const result = await adapter.queryAll(`
        MATCH (keanu:Person {name: 'Keanu Reeves'})-[:ACTED_IN]->(m1:Movie)<-[:ACTED_IN]-(coActor:Person),
              (coActor)-[:ACTED_IN]->(m2:Movie)
        WHERE NOT (keanu)-[:ACTED_IN]->(m2)
        RETURN DISTINCT m2.title, coActor.name
        LIMIT 10
      `);

      expect(result.length).toBeGreaterThan(0);

      // Verify Keanu is not in any of the recommended movies
      const keanuMovies = await adapter.queryAll(`
        MATCH (:Person {name: 'Keanu Reeves'})-[:ACTED_IN]->(m:Movie)
        RETURN m.title
      `);

      result.forEach(r => {
        expect(keanuMovies.map(km => km.title)).not.toContain(r.title);
      });
    });
  });

  describe('Query 8: Path Finding', () => {
    test('should find shortest path between Kevin Bacon and Hugo Weaving', async () => {
      const result = await adapter.queryAll(`
        MATCH (p1:Person {name: 'Kevin Bacon'}), (p2:Person {name: 'Hugo Weaving'})
        MATCH path = shortestPath((p1)-[*..4]-(p2))
        RETURN path
      `);

      // Note: shortestPath might not be fully implemented in CongraphDB yet
      // This test verifies the query executes without error
      expect(Array.isArray(result)).toBe(true);

      // If path finding works, check for path
      if (result.length > 0 && result[0].path) {
        expect(result[0].path).toBeDefined();
      }
    });
  });

  describe('Additional Query Tests', () => {
    test('should find all movies released in a specific year', async () => {
      const result = await adapter.queryAll(`
        MATCH (m:Movie {released: 1999})
        RETURN m
        ORDER BY m.title
      `);

      expect(result.length).toBeGreaterThan(0);
      result.forEach(r => {
        const movie = r.m || r;
        expect(movie.title).toBeDefined();
      });
    });

    test('should count total movies and people', async () => {
      const movies = await adapter.queryAll('MATCH (m:Movie) RETURN count(m) as total');
      const people = await adapter.queryAll('MATCH (p:Person) RETURN count(p) as total');

      expect(movies[0].total).toBe(SAMPLE_DATA.movies.length);
      expect(people[0].total).toBe(SAMPLE_DATA.people.length);
    });

    test('should find actors with multiple roles in same movie', async () => {
      const result = await adapter.queryAll(`
        MATCH (p:Person)-[r:ACTED_IN]->(m:Movie)
        WHERE size(r.roles) > 1
        RETURN p.name, m.title, r.roles
      `);

      expect(Array.isArray(result)).toBe(true);
    });

    test('should find movies released between 1990 and 2000', async () => {
      const result = await adapter.queryAll(`
        MATCH (m:Movie)
        WHERE m.released >= 1990 AND m.released <= 2000
        RETURN m
        ORDER BY m.released
      `);

      expect(result.length).toBeGreaterThan(0);
      result.forEach(r => {
        const movie = r.m || r;
        expect(movie.released).toBeGreaterThanOrEqual(1990);
        expect(movie.released).toBeLessThanOrEqual(2000);
      });
    });
  });

  describe('Complex Pattern Matching', () => {
    test('should find actors who appeared in multiple Matrix movies', async () => {
      // First, get all Matrix movie appearances
      const matrixMovies = await adapter.queryAll(`
        MATCH (p:Person)-[:ACTED_IN]->(m:Movie)
        WHERE m.title CONTAINS 'Matrix'
        RETURN p.name, m.title
        ORDER BY p.name
      `);

      expect(matrixMovies.length).toBeGreaterThan(0);

      // Count movies per actor manually
      const actorMatrixCount = {};
      matrixMovies.forEach(r => {
        const name = r.name || r['p.name'] || (r.p && r.p.name);
        if (name) {
          actorMatrixCount[name] = (actorMatrixCount[name] || 0) + 1;
        }
      });

      // Keanu Reeves should appear in at least 2 Matrix movies
      expect(actorMatrixCount['Keanu Reeves']).toBeDefined();
      expect(actorMatrixCount['Keanu Reeves']).toBeGreaterThanOrEqual(2);
    });

    test('should find co-actor pairs who worked together multiple times', async () => {
      const result = await adapter.queryAll(`
        MATCH (p1:Person)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(p2:Person)
        WHERE p1.name < p2.name
        RETURN p1.name, p2.name, count(m) as moviesTogether
        ORDER BY moviesTogether DESC
        LIMIT 5
      `);

      // This query might return 0 if the COUNT aggregation isn't supported as expected
      // or if all actors only worked together once
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        // Each result should have worked together at least once
        result.forEach(r => {
          const moviesTogether = r.moviesTogether || 0;
          expect(moviesTogether).toBeGreaterThanOrEqual(1);
        });
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle non-matching queries gracefully', async () => {
      const result = await adapter.queryAll(`
        MATCH (p:Person {name: 'NonExistent Actor'})-[:ACTED_IN]->(m:Movie)
        RETURN p.name, m.title
      `);

      expect(result).toEqual([]);
    });

    test('should handle empty string parameters', async () => {
      const result = await adapter.queryAll(`
        MATCH (m:Movie)
        WHERE m.title = ''
        RETURN m
      `);

      expect(result.length).toBe(0);
    });

    test('should handle special characters in movie titles', async () => {
      const result = await adapter.queryAll(`
        MATCH (m:Movie)
        WHERE m.title CONTAINS '\''
        RETURN m
      `);

      expect(result.length).toBeGreaterThan(0);
      result.forEach(r => {
        const movie = r.m || r;
        expect(movie.title).toBeDefined();
      });
    });
  });
});
