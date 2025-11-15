import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function fixDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('⚠️  Dropping old users table if it exists...');
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);
    console.log('✅ Old table dropped!');

    console.log('📋 Creating new users table with correct schema...');
    await client.query(`
      CREATE TABLE users (
        id serial PRIMARY KEY NOT NULL,
        email text NOT NULL,
        password_hash text NOT NULL,
        avatar_url text,
        bio text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Users table created!');

    console.log('📋 Creating email index...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS email_idx ON users USING btree (email);
    `);
    console.log('✅ Email index created!');

    console.log('📋 Adding foreign key constraint...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'journal_entries_user_id_users_id_fk'
        ) THEN
          ALTER TABLE journal_entries 
          ADD CONSTRAINT journal_entries_user_id_users_id_fk 
          FOREIGN KEY (user_id) REFERENCES users(id) 
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    console.log('✅ Foreign key constraint added!');

    console.log('🎉 Database fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabase();
