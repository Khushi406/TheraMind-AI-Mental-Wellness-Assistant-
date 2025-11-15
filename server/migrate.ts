import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate as drizzleMigrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { config } from 'dotenv';

config();

async function migrate() {
  console.log('🔄 Running database migrations...');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    const db = drizzle(client);
    await drizzleMigrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();