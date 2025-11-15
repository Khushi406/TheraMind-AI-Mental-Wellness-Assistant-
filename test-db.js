import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function testDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check if users table exists
    console.log('📋 Checking users table...');
    const usersCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log('✅ Users table columns:');
    usersCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Check if journal_entries table exists
    console.log('\n📋 Checking journal_entries table...');
    const entriesCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'journal_entries'
      ORDER BY ordinal_position;
    `);
    console.log('✅ Journal entries table columns:');
    entriesCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Count existing users
    console.log('\n📊 Checking existing data...');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Users in database: ${userCount.rows[0].count}`);

    const entryCount = await client.query('SELECT COUNT(*) FROM journal_entries');
    console.log(`✅ Journal entries in database: ${entryCount.rows[0].count}`);

    console.log('\n🎉 Database is working correctly!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabase();
