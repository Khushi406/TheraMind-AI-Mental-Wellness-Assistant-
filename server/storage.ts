import { 
  JournalEntry, 
  InsertJournalEntry, 
  JournalPrompt, 
  InsertJournalPrompt, 
  Emotion,
  users,
  journalEntries,
  journalPrompts,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Journal Entry Methods
  getJournalEntryById(id: number): Promise<JournalEntry | undefined>;
  getAllJournalEntries(): Promise<JournalEntry[]>;
  saveJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  
  // Journal Prompt Methods
  getPrompt(): Promise<JournalPrompt | undefined>;
  savePrompt(prompt: InsertJournalPrompt): Promise<JournalPrompt>;
  
  // User Methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Journal Entry methods
  async getJournalEntryById(id: number): Promise<JournalEntry | undefined> {
    const result = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return result[0];
  }
  
  async getAllJournalEntries(): Promise<JournalEntry[]> {
    // Return all entries sorted by timestamp (newest first)
    return await db.select().from(journalEntries).orderBy(desc(journalEntries.timestamp));
  }
  
  async saveJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const result = await db.insert(journalEntries).values(entry).returning();
    return result[0];
  }
  
  // Journal Prompt methods
  async getPrompt(): Promise<JournalPrompt | undefined> {
    // Get all prompts
    const prompts = await db.select().from(journalPrompts);
    
    if (prompts.length === 0) {
      // If no prompts in DB, create a default one
      const defaultPrompt = {
        prompt: "What made you feel grateful today, and how did those moments affect your overall mood?",
        affirmation: "I acknowledge my emotions and treat myself with compassion. Each day is an opportunity for growth."
      };
      
      const newPrompt = await this.savePrompt(defaultPrompt);
      return newPrompt;
    }
    
    // Get a random prompt from the available ones
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  }
  
  async savePrompt(prompt: InsertJournalPrompt): Promise<JournalPrompt> {
    const result = await db.insert(journalPrompts).values(prompt).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
