import { 
  JournalEntry, 
  InsertJournalEntry, 
  JournalPrompt, 
  InsertJournalPrompt, 
  Emotion 
} from "@shared/schema";

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

// Import the existing User types
import { users, type User, type InsertUser } from "@shared/schema";

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journalEntries: Map<number, JournalEntry>;
  private journalPrompts: Map<number, JournalPrompt>;
  private currentUserId: number;
  private currentEntryId: number;
  private currentPromptId: number;

  constructor() {
    this.users = new Map();
    this.journalEntries = new Map();
    this.journalPrompts = new Map();
    this.currentUserId = 1;
    this.currentEntryId = 1;
    this.currentPromptId = 1;
    
    // Add some initial prompts
    this.savePrompt({
      prompt: "What made you feel grateful today, and how did those moments affect your overall mood?",
      affirmation: "I acknowledge my emotions and treat myself with compassion. Each day is an opportunity for growth."
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Journal Entry methods
  async getJournalEntryById(id: number): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }
  
  async getAllJournalEntries(): Promise<JournalEntry[]> {
    // Return all entries sorted by timestamp (newest first)
    return Array.from(this.journalEntries.values())
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });
  }
  
  async saveJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.currentEntryId++;
    const journalEntry: JournalEntry = { ...entry, id };
    this.journalEntries.set(id, journalEntry);
    return journalEntry;
  }
  
  // Journal Prompt methods
  async getPrompt(): Promise<JournalPrompt | undefined> {
    // For now, just return the most recent prompt
    const prompts = Array.from(this.journalPrompts.values());
    if (prompts.length === 0) return undefined;
    
    // Get a random prompt from the available ones
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  }
  
  async savePrompt(prompt: InsertJournalPrompt): Promise<JournalPrompt> {
    const id = this.currentPromptId++;
    const created_at = new Date();
    const journalPrompt: JournalPrompt = { ...prompt, id, created_at };
    this.journalPrompts.set(id, journalPrompt);
    return journalPrompt;
  }
}

export const storage = new MemStorage();
