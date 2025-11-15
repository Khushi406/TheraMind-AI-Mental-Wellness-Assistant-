import { pgTable, text, serial, integer, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password_hash: text("password_hash").notNull(),
  avatar_url: text("avatar_url"),
  bio: text("bio"),
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    emailIdx: uniqueIndex("email_idx").on(table.email),
  };
});

// Insert schema for users
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password_hash: true,
});

// Export types for users
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Journal entry table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  emotions: jsonb("emotions").notNull(),
  reflection: text("reflection"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  user_id: integer("user_id").references(() => users.id),
});

// Set up relations
export const usersRelations = relations(users, ({ many }) => ({
  journalEntries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.user_id],
    references: [users.id],
  }),
}));

// Insert schema for journal entries
export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  content: true,
  emotions: true,
  reflection: true,
  timestamp: true,
  user_id: true,
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
  user_id: integer("user_id").references(() => users.id),
});

// Journal prompts relations
export const journalPromptsRelations = relations(journalPrompts, ({ one }) => ({
  user: one(users, {
    fields: [journalPrompts.user_id],
    references: [users.id],
  }),
}));

// Insert schema for journal prompts
export const insertJournalPromptSchema = createInsertSchema(journalPrompts).pick({
  prompt: true,
  affirmation: true,
  user_id: true,
});

// Export types
export type InsertJournalPrompt = z.infer<typeof insertJournalPromptSchema>;
export type JournalPrompt = typeof journalPrompts.$inferSelect;
