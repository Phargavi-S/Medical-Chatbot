import {
  type Message,
  type InsertMessage,
  type Conversation,
  type InsertConversation,
  type DocumentChunk,
  type InsertDocumentChunk,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation>;
  
  // Document chunk operations
  createDocumentChunk(chunk: InsertDocumentChunk): Promise<DocumentChunk>;
  getDocumentChunks(documentId: string): Promise<DocumentChunk[]>;
  searchChunksByEmbedding(embedding: number[], limit?: number): Promise<DocumentChunk[]>;
  getAllChunks(): Promise<DocumentChunk[]>;
}

export class MemStorage implements IStorage {
  private messages: Map<string, Message>;
  private conversations: Map<string, Conversation>;
  private documentChunks: Map<string, DocumentChunk>;

  constructor() {
    this.messages = new Map();
    this.conversations = new Map();
    this.documentChunks = new Map();
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Conversation operations
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
    const existing = this.conversations.get(id);
    if (!existing) {
      throw new Error(`Conversation ${id} not found`);
    }
    const updated: Conversation = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  // Document chunk operations
  async createDocumentChunk(insertChunk: InsertDocumentChunk): Promise<DocumentChunk> {
    const id = randomUUID();
    const chunk: DocumentChunk = {
      ...insertChunk,
      id,
    };
    this.documentChunks.set(id, chunk);
    return chunk;
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return Array.from(this.documentChunks.values())
      .filter((chunk) => chunk.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async searchChunksByEmbedding(queryEmbedding: number[], limit: number = 5): Promise<DocumentChunk[]> {
    // Simple cosine similarity search
    const chunksWithScores = Array.from(this.documentChunks.values())
      .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
      .map((chunk) => {
        const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding!);
        return { chunk, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return chunksWithScores.map((item) => item.chunk);
  }

  async getAllChunks(): Promise<DocumentChunk[]> {
    return Array.from(this.documentChunks.values());
  }

  // Helper: Cosine similarity calculation
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const storage = new MemStorage();
