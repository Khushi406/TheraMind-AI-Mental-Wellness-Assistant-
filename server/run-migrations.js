// Auto-run migrations on production startup
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📋 Creating users table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY NOT NULL,
        email text NOT NULL,
        password_hash text NOT NULL,
        avatar_url text,
        bio text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Users table ready!');

    console.log('📋 Creating email index if not exists...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS email_idx ON users USING btree (email);
    `);
    console.log('✅ Email index ready!');

    console.log('📋 Creating journal_entries table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id serial PRIMARY KEY NOT NULL,
        content text NOT NULL,
        emotions jsonb NOT NULL,
        reflection text,
        timestamp timestamp DEFAULT now() NOT NULL,
        user_id integer
      );
    `);
    console.log('✅ Journal entries table ready!');

    console.log('📋 Creating journal_prompts table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_prompts (
        id serial PRIMARY KEY NOT NULL,
        prompt text NOT NULL,
        affirmation text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        user_id integer
      );
    `);
    console.log('✅ Journal prompts table ready!');

    console.log('📋 Adding foreign key constraints if not exist...');
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

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'journal_prompts_user_id_users_id_fk'
        ) THEN
          ALTER TABLE journal_prompts 
          ADD CONSTRAINT journal_prompts_user_id_users_id_fk 
          FOREIGN KEY (user_id) REFERENCES users(id) 
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    console.log('✅ Foreign key constraints ready!');

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
