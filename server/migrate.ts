import { db } from './db.js';
import * as schema from '@shared/schema.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create tables if they don't exist
    console.log('📋 Creating tables...');
    
    // This will run the SQL to create tables based on your schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "journal_entries" (
        "id" serial PRIMARY KEY NOT NULL,
        "content" text NOT NULL,
        "emotion" varchar(100),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" varchar(255) UNIQUE NOT NULL,
        "email" varchar(255) UNIQUE NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();