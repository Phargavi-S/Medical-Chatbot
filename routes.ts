import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { queryRAG, queryRAGStream, indexDocument, getIndexStats } from "./services/ragService";
import { listDriveFiles } from "./lib/googleDrive";
import type { ChatRequest, ChatResponse, ProcessDocumentRequest, ProcessDocumentResponse, Citation } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint with streaming - main RAG query
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const requestSchema = z.object({
        message: z.string().min(1, "Message cannot be empty"),
        conversationId: z.string().optional(),
      });

      const validated = requestSchema.parse(req.body);
      const { message, conversationId } = validated as ChatRequest;

      console.log(`Received streaming chat message: "${message}"`);

      // Create or get conversation
      let convId = conversationId;
      if (!convId) {
        const newConv = await storage.createConversation({
          title: message.slice(0, 50),
        });
        convId = newConv.id;
      }

      // Store user message
      await storage.createMessage({
        conversationId: convId,
        role: "user",
        content: message,
        citations: null,
      });

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullContent = '';
      let citations: Citation[] = [];
      let messageId = '';

      try {
        // Stream RAG response
        for await (const chunk of queryRAGStream(message)) {
          if (chunk.type === 'citations') {
            citations = chunk.data;
            // Send conversation ID and citations at the beginning
            res.write(`data: ${JSON.stringify({ type: 'init', conversationId: convId, citations })}\n\n`);
          } else if (chunk.type === 'token') {
            fullContent += chunk.data;
            res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.data })}\n\n`);
          }
        }

        // Store complete assistant message
        const assistantMessage = await storage.createMessage({
          conversationId: convId,
          role: "assistant",
          content: fullContent,
          citations,
        });

        messageId = assistantMessage.id;

        // Send completion event
        res.write(`data: ${JSON.stringify({ type: 'done', messageId, timestamp: assistantMessage.timestamp.toISOString() })}\n\n`);
      } catch (streamError: any) {
        console.error("Error during streaming:", streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', error: streamError.message })}\n\n`);
      }

      res.end();
    } catch (error: any) {
      console.error("Error in /api/chat/stream:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromError(error).toString(),
        });
      }

      res.status(500).json({
        error: "Failed to process message",
        message: error.message,
      });
    }
  });

  // Non-streaming chat endpoint (fallback)
  app.post("/api/chat", async (req, res) => {
    try {
      const requestSchema = z.object({
        message: z.string().min(1, "Message cannot be empty"),
        conversationId: z.string().optional(),
      });

      const validated = requestSchema.parse(req.body);
      const { message, conversationId } = validated as ChatRequest;

      console.log(`Received chat message: "${message}"`);

      // Create or get conversation
      let convId = conversationId;
      if (!convId) {
        const newConv = await storage.createConversation({
          title: message.slice(0, 50),
        });
        convId = newConv.id;
      }

      // Store user message
      await storage.createMessage({
        conversationId: convId,
        role: "user",
        content: message,
        citations: null,
      });

      // Query RAG system
      const ragResponse = await queryRAG(message);

      // Store assistant message
      const assistantMessage = await storage.createMessage({
        conversationId: convId,
        role: "assistant",
        content: ragResponse.answer,
        citations: ragResponse.citations,
      });

      const response: ChatResponse = {
        messageId: assistantMessage.id,
        conversationId: convId,
        content: ragResponse.answer,
        citations: ragResponse.citations,
        timestamp: assistantMessage.timestamp.toISOString(),
      };

      res.json(response);
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromError(error).toString(),
        });
      }

      res.status(500).json({
        error: "Failed to process message",
        message: error.message,
      });
    }
  });

  // List available documents in Google Drive
  app.get("/api/documents", async (req, res) => {
    try {
      const files = await listDriveFiles();
      res.json({ files });
    } catch (error: any) {
      console.error("Error listing documents:", error);
      res.status(500).json({
        error: "Failed to list documents",
        message: error.message,
      });
    }
  });

  // Process and index a document from Google Drive
  app.post("/api/documents/process", async (req, res) => {
    try {
      const requestSchema = z.object({
        fileId: z.string().min(1),
        fileName: z.string().min(1),
      });

      const validated = requestSchema.parse(req.body);
      const { fileId, fileName } = validated as ProcessDocumentRequest;

      console.log(`Processing document: ${fileName} (${fileId})`);

      const result = await indexDocument(fileId);

      const response: ProcessDocumentResponse = {
        documentId: result.documentId,
        chunksProcessed: result.chunksProcessed,
        status: "success",
      };

      res.json(response);
    } catch (error: any) {
      console.error("Error processing document:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromError(error).toString(),
        });
      }

      res.status(500).json({
        error: "Failed to process document",
        message: error.message,
      });
    }
  });

  // Get RAG index statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await getIndexStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error getting stats:", error);
      res.status(500).json({
        error: "Failed to get statistics",
        message: error.message,
      });
    }
  });

  // Get conversation history
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversation(id);
      res.json({ messages });
    } catch (error: any) {
      console.error("Error getting messages:", error);
      res.status(500).json({
        error: "Failed to get messages",
        message: error.message,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
