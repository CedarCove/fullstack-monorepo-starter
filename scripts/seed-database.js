#!/usr/bin/env node

/**
 * Database seeding script
 *
 * Seeds the database with example data for development
 *
 * Usage: pnpm db:seed
 */

console.log('\n🌱 Seeding database...\n');
console.log('This script would seed your database with example data.');
console.log('');
console.log('To implement this:');
console.log('  1. Import your database client from packages/database');
console.log('  2. Define seed data');
console.log('  3. Insert data using Drizzle ORM');
console.log('');
console.log('Example:');
console.log('');
console.log('  const { db, profiles, todos } = require("../packages/database/src");');
console.log('');
console.log('  const seedData = async () => {');
console.log('    await db.insert(profiles).values([');
console.log('      { id: "1", displayName: "Alice" },');
console.log('      { id: "2", displayName: "Bob" },');
console.log('    ]);');
console.log('  };');
console.log('');
console.log('⚠️  Note: This is a placeholder. Implement your seeding logic here.');
console.log('');
