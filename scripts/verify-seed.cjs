#!/usr/bin/env node
'use strict';

const { Database } = require('congraphdb');
const path = require('path');

async function verifySeed() {
  const dbPath = path.join(__dirname, '..', 'movies.cgraph');

  const db = new Database(dbPath);
  await db.init();
  const conn = db.createConnection();

  console.log('Checking relationships after seed...\n');

  const result = await conn.query(`MATCH (p:Person)-[:ACTED_IN]->(m:Movie) RETURN count(p) as count`);
  const rows = await result.getAll();
  const count = rows[0]?.count || rows[0]?.['count(p)'] || 0;

  console.log(`ACTED_IN relationships: ${count}`);

  if (count > 0) {
    console.log('✓ Relationships exist in memory!');
  } else {
    console.log('✗ No relationships found in memory!');
  }

  await conn.close();
  await db.close();

  console.log('\nReopening to check persistence...\n');

  const db2 = new Database(dbPath);
  await db2.init();
  const conn2 = db2.createConnection();

  const result2 = await conn2.query(`MATCH (p:Person)-[:ACTED_IN]->(m:Movie) RETURN count(p) as count`);
  const rows2 = await result2.getAll();
  const count2 = rows2[0]?.count || rows2[0]?.['count(p)'] || 0;

  console.log(`ACTED_IN relationships after reopen: ${count2}`);

  if (count2 > 0) {
    console.log('✓ Relationships persisted!');
  } else {
    console.log('✗ Relationships were lost after close!');
  }

  await conn2.close();
  await db2.close();
}

verifySeed().catch(console.error);
