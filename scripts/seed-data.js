/**
 * Seed CongraphDB with sample Movies data
 *
 * This script is a wrapper around seed-database.js
 */

const path = require('path');
const { seedDatabase } = require('./seed-database');

const dbPath = path.join(__dirname, '..', 'movies.cgraph');

console.log('Starting data seed...');
seedDatabase(dbPath)
  .then(() => {
    console.log('Seed successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
