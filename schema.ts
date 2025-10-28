import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Message schema for chat interface
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey(),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  citations: jsonb("citations").$type<Citation[]>(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Conversation schema
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey(),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Document chunks for RAG
export const documentChunks = pgTable("document_chunks", {
  id: varchar("id").primaryKey(),
  documentId: varchar("document_id").notNull(),
  content: text("content").notNull(),
  embedding: jsonb("embedding").$type<number[]>(),
  metadata: jsonb("metadata").$type<DocumentMetadata>(),
  chunkIndex: integer("chunk_index").notNull(),
});

// TypeScript types
export type Citation = {
  source: string;
  excerpt: string;
  confidence?: number;
  page?: number;
};

export type DocumentMetadata = {
  fileName: string;
  fileId: string;
  totalChunks: number;
  processedAt: string;
};

// Insert schemas
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).omit({
  id: true,
});

// Inferred types
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertDocumentChunk = z.infer<typeof insertDocumentChunkSchema>;
export type DocumentChunk = typeof documentChunks.$inferSelect;

// API request/response types
export type ChatRequest = {
  message: string;
  conversationId?: string;
};

export type ChatResponse = {
  messageId: string;
  conversationId: string;
  content: string;
  citations: Citation[];
  timestamp: string;
};

export type ProcessDocumentRequest = {
  fileId: string;
  fileName: string;
};

export type ProcessDocumentResponse = {
  documentId: string;
  chunksProcessed: number;
  status: string;
};
