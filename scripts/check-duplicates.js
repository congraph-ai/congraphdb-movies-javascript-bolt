const { Database } = require('congraphdb');
const path = require('path');

async function checkDuplicates() {
  const dbPath = path.join(__dirname, '..', 'movies.cgraph');
  console.log(`Checking database at: ${dbPath}`);

  const db = new Database(dbPath);
  await db.init();
  const conn = db.createConnection();

  try {
    console.log('\n--- Movie Count by Title ---');
    const result = await conn.query("MATCH (m:Movie) RETURN m.title as title, count(*) as count ORDER BY count DESC");
    const rows = await result.getAll();
    
    let totalDuplicates = 0;
    rows.forEach(row => {
      if (row.count > 1) {
        console.log(`DUPLICATE: "${row.title}" - Count: ${row.count}`);
        totalDuplicates++;
      }
    });

    if (totalDuplicates === 0) {
      console.log('No duplicate movie titles found.');
    }

    console.log(`\nTotal unique movie titles: ${rows.length}`);
    const totalCount = rows.reduce((acc, row) => acc + row.count, 0);
    console.log(`Total movie nodes: ${totalCount}`);

    console.log('\n--- Sample "The Matrix" records ---');
    const matrixResult = await conn.query("MATCH (m:Movie {title: 'The Matrix'}) RETURN m.title as title, m.released as released, m.tagline as tagline");
    const matrixRows = await matrixResult.getAll();
    console.log(JSON.stringify(matrixRows, null, 2));

  } catch (error) {
    console.error('Error checking duplicates:', error);
  } finally {
    await db.close();
  }
}

checkDuplicates();
