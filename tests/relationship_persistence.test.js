/**
 * Relationship Persistence Tests
 *
 * Tests for verifying that relationships created via Cypher
 * are persisted to disk and survive database close/reopen.
 *
 * Run: npm test -- tests/relationship_persistence.test.js
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Database } = require('congraphdb');

const TEST_DB_PATH = path.join(__dirname, 'test-persistence.cgraph');
const TEST_WAL_PATH = TEST_DB_PATH + '.wal';

async function getFileSize(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function cleanUp() {
  for (const filePath of [TEST_DB_PATH, TEST_WAL_PATH]) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

describe('Relationship Persistence', () => {
  let db, conn;

  beforeEach(async () => {
    await cleanUp();
  });

  afterEach(async () => {
    if (conn) await conn.close();
    if (db) await db.close();
    await cleanUp();
  });

  test('relationships should persist after database close and reopen', async () => {
    // Step 1: Create and initialize database
    db = new Database(TEST_DB_PATH);
    await db.init();
    conn = db.createConnection();

    // Get initial WAL size
    const initialWalSize = await getFileSize(TEST_WAL_PATH);
    console.log(`Initial WAL size: ${initialWalSize} bytes`);

    // Step 2: Create schema
    await conn.query(`CREATE NODE TABLE Person(name STRING)`);
    await conn.query(`CREATE NODE TABLE Movie(title STRING, released INTEGER)`);
    await conn.query(`CREATE REL TABLE ACTED_IN(FROM Person TO Movie)`);

    // Step 3: Insert nodes
    await conn.query(`CREATE (p:Person {name: 'Keanu Reeves', born: 1964})`);
    await conn.query(`CREATE (m:Movie {title: 'The Matrix', released: 1999})`);
    await conn.query(`CREATE (p2:Person {name: 'Laurence Fishburne', born: 1961})`);
    await conn.query(`CREATE (m2:Movie {title: 'The Matrix Reloaded', released: 2003})`);

    // Step 4: Create relationships
    await conn.query(`
      MATCH (p:Person {name: 'Keanu Reeves'}), (m:Movie {title: 'The Matrix'})
      CREATE (p)-[:ACTED_IN {roles: ['Neo']}]->(m)
    `);

    await conn.query(`
      MATCH (p:Person {name: 'Laurence Fishburne'}), (m:Movie {title: 'The Matrix'})
      CREATE (p)-[:ACTED_IN {roles: ['Morpheus']}]->(m)
    `);

    await conn.query(`
      MATCH (p:Person {name: 'Keanu Reeves'}), (m:Movie {title: 'The Matrix Reloaded'})
      CREATE (p)-[:ACTED_IN {roles: ['Neo']}]->(m)
    `);

    const walAfterCreate = await getFileSize(TEST_WAL_PATH);
    console.log(`WAL size after CREATE: ${walAfterCreate} bytes`);

    // Step 5: Verify relationships exist BEFORE closing
    const resultBefore = await conn.query(`
      MATCH (p:Person)-[:ACTED_IN]->(m:Movie)
      RETURN count(p) as count
    `);
    const rowsBefore = await resultBefore.getAll();
    const countBefore = rowsBefore[0]?.count || rowsBefore[0]?.['count(p)'] || 0;
    console.log(`Relationships before close: ${countBefore}`);

    expect(countBefore).toBe(3);

    // Verify individual relationships
    const keanuResult = await conn.query(`
      MATCH (p:Person {name: 'Keanu Reeves'})-[:ACTED_IN]->(m:Movie)
      RETURN count(m) as count
    `);
    const keanuRows = await keanuResult.getAll();
    const keanuCount = keanuRows[0]?.count || keanuRows[0]?.['count(m)'] || 0;
    console.log(`Keanu Reeves movies before close: ${keanuCount}`);
    expect(keanuCount).toBe(2);

    // Step 6: Close database
    await conn.close();
    await db.close();
    conn = null;
    db = null;

    const walAfterClose = await getFileSize(TEST_WAL_PATH);
    console.log(`WAL size after close: ${walAfterClose} bytes`);

    // Step 7: Reopen database
    db = new Database(TEST_DB_PATH);
    await db.init();
    conn = db.createConnection();

    // Step 8: Verify relationships exist AFTER reopening
    const resultAfter = await conn.query(`
      MATCH (p:Person)-[:ACTED_IN]->(m:Movie)
      RETURN count(p) as count
    `);
    const rowsAfter = await resultAfter.getAll();
    const countAfter = rowsAfter[0]?.count || rowsAfter[0]?.['count(p)'] || 0;
    console.log(`Relationships after reopen: ${countAfter}`);

    // Relationships should persist
    expect(countAfter).toBe(3);

    // Verify nodes still exist
    const personResult = await conn.query('MATCH (p:Person) RETURN count(p) as count');
    const personRows = await personResult.getAll();
    const personCount = personRows[0]?.count || personRows[0]?.['count(p)'] || 0;
    console.log(`People after reopen: ${personCount}`);
    expect(personCount).toBe(2);

    const movieResult = await conn.query('MATCH (m:Movie) RETURN count(m) as count');
    const movieRows = await movieResult.getAll();
    const movieCount = movieRows[0]?.count || movieRows[0]?.['count(m)'] || 0;
    console.log(`Movies after reopen: ${movieCount}`);
    expect(movieCount).toBe(2);

    // Final WAL size check
    const finalWalSize = await getFileSize(TEST_WAL_PATH);
    console.log(`Final WAL size: ${finalWalSize} bytes`);

    // Log summary
    console.log('\n' + '='.repeat(60));
    console.log(`Relationships persisted: ${countAfter}/${countBefore}`);
    console.log(`WAL file size: ${finalWalSize} bytes`);
    console.log('='.repeat(60));
  });

  test('manual checkpoint should persist relationships', async () => {
    // This test verifies the checkpoint behavior
    db = new Database(TEST_DB_PATH);
    await db.init();
    conn = db.createConnection();

    // Create schema
    await conn.query(`CREATE NODE TABLE Person(name STRING)`);
    await conn.query(`CREATE NODE TABLE Movie(title STRING)`);
    await conn.query(`CREATE REL TABLE ACTED_IN(FROM Person TO Movie)`);

    // Create nodes and relationships
    await conn.query(`CREATE (p:Person {name: 'Actor1'})`);
    await conn.query(`CREATE (m:Movie {title: 'Movie1'})`);
    await conn.query(`
      MATCH (p:Person {name: 'Actor1'}), (m:Movie {title: 'Movie1'})
      CREATE (p)-[:ACTED_IN]->(m)
    `);

    // Execute checkpoint
    db.checkpoint();
    console.log('Manual checkpoint executed');

    // Verify before close
    const resultBefore = await conn.query(`
      MATCH (p:Person)-[:ACTED_IN]->(m:Movie)
      RETURN count(p) as count
    `);
    const rowsBefore = await resultBefore.getAll();
    const countBefore = rowsBefore[0]?.count || rowsBefore[0]?.['count(p)'] || 0;
    expect(countBefore).toBe(1);

    // Close and reopen
    await conn.close();
    await db.close();
    conn = null;
    db = null;

    db = new Database(TEST_DB_PATH);
    await db.init();
    conn = db.createConnection();

    // Verify after reopen
    const resultAfter = await conn.query(`
      MATCH (p:Person)-[:ACTED_IN]->(m:Movie)
      RETURN count(p) as count
    `);
    const rowsAfter = await resultAfter.getAll();
    const countAfter = rowsAfter[0]?.count || rowsAfter[0]?.['count(p)'] || 0;

    // With checkpoint, relationships should persist
    console.log(`Relationships after reopen (with checkpoint): ${countAfter}`);
    expect(countAfter).toBe(1);
  });
});
