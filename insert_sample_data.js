// Sample data insertion script for TheraMind Wellness
// Run this script to populate your database with test data

import { db } from './server/db.js';
import { users, journalEntries, journalPrompts } from './shared/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function insertSampleData() {
  try {
    console.log('🌱 Starting to insert sample data...');
    
    // Read the sample data
    const sampleDataPath = path.join(__dirname, 'sample_data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    // Insert users first
    console.log('👤 Inserting sample users...');
    const insertedUsers = await db.insert(users).values(sampleData.users).returning();
    console.log(`✅ Inserted ${insertedUsers.length} users`);
    
    const userId = insertedUsers[0].id;
    
    // Insert journal prompts
    console.log('💭 Inserting journal prompts...');
    const promptsWithUserId = sampleData.journalPrompts.map(prompt => ({
      ...prompt,
      user_id: userId
    }));
    
    const insertedPrompts = await db.insert(journalPrompts).values(promptsWithUserId).returning();
    console.log(`✅ Inserted ${insertedPrompts.length} journal prompts`);
    
    // Insert journal entries
    console.log('📝 Inserting journal entries...');
    const entriesWithUserId = sampleData.journalEntries.map(entry => ({
      ...entry,
      user_id: userId
    }));
    
    const insertedEntries = await db.insert(journalEntries).values(entriesWithUserId).returning();
    console.log(`✅ Inserted ${insertedEntries.length} journal entries`);
    
    console.log('🎉 Sample data insertion completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${insertedUsers.length}`);
    console.log(`   Journal Entries: ${insertedEntries.length}`);
    console.log(`   Journal Prompts: ${insertedPrompts.length}`);
    console.log('\n🔧 Test credentials:');
    console.log(`   Username: testuser`);
    console.log(`   Password: password123`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    process.exit(1);
  }
}

// Run the insertion
insertSampleData();