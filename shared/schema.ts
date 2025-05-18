import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Journal entry table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  emotions: jsonb("emotions").notNull(),
  reflection: text("reflection"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schema for journal entries
export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  content: true,
  emotions: true,
  reflection: true,
  timestamp: true,
});

// Define emotion type for better TypeScript support
export const emotionSchema = z.object({
  label: z.string(),
  score: z.number(),
});

// Update the insert schema to include the emotion type
export const enhancedInsertJournalEntrySchema = insertJournalEntrySchema.extend({
  emotions: z.array(emotionSchema),
});

// Export types
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Emotion = z.infer<typeof emotionSchema>;

// Journal prompt table
export const journalPrompts = pgTable("journal_prompts", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  affirmation: text("affirmation").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Insert schema for journal prompts
export const insertJournalPromptSchema = createInsertSchema(journalPrompts).pick({
  prompt: true,
  affirmation: true,
});

// Export types
export type InsertJournalPrompt = z.infer<typeof insertJournalPromptSchema>;
export type JournalPrompt = typeof journalPrompts.$inferSelect;
