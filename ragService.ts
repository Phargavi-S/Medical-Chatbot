import { storage } from "../storage";
import { generateEmbedding, generateChatCompletion, generateChatCompletionStream, generateEmbeddings } from "../lib/openai";
import { processDocument } from "./documentProcessor";
import { type Citation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface RAGResponse {
  answer: string;
  citations: Citation[];
}

// Process and store a document for RAG
export async function indexDocument(fileId: string): Promise<{ documentId: string; chunksProcessed: number }> {
  console.log(`Starting indexing for file: ${fileId}`);
  
  // Process document
  const processed = await processDocument(fileId);
  const documentId = randomUUID();

  // Generate embeddings for all chunks in batch
  console.log(`Generating embeddings for ${processed.chunks.length} chunks...`);
  const embeddings = await generateEmbeddings(processed.chunks);

  // Store chunks with embeddings
  const chunkPromises = processed.chunks.map(async (chunk, index) => {
    return storage.createDocumentChunk({
      documentId,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        fileName: processed.fileName,
        fileId: processed.fileId,
        totalChunks: processed.chunks.length,
        processedAt: new Date().toISOString(),
      },
      chunkIndex: index,
    });
  });

  await Promise.all(chunkPromises);

  console.log(`Indexed ${processed.chunks.length} chunks for document ${documentId}`);

  return {
    documentId,
    chunksProcessed: processed.chunks.length,
  };
}

// Query the RAG system
export async function queryRAG(question: string): Promise<RAGResponse> {
  console.log(`RAG query: "${question}"`);

  // Generate embedding for the question
  const questionEmbedding = await generateEmbedding(question);

  // Search for relevant chunks
  const relevantChunks = await storage.searchChunksByEmbedding(questionEmbedding, 5);

  console.log(`Found ${relevantChunks.length} relevant chunks`);

  if (relevantChunks.length === 0) {
    // No indexed documents yet
    return {
      answer: "I don't have any medical documents indexed yet to answer your question. Please upload medical datasets to Google Drive and index them first, or I can provide general medical information based on my training.",
      citations: [],
    };
  }

  // Build context from relevant chunks
  const context = relevantChunks
    .map((chunk, idx) => `[Source ${idx + 1}: ${chunk.metadata?.fileName || 'Unknown'}]\n${chunk.content}`)
    .join('\n\n---\n\n');

  // Generate response using GPT-5
  const answer = await generateChatCompletion(question, context);

  // Create citations from relevant chunks
  const citations: Citation[] = relevantChunks.map((chunk) => ({
    source: chunk.metadata?.fileName || 'Unknown Source',
    excerpt: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    confidence: 0.85, // Could be calculated based on similarity score
    page: chunk.chunkIndex + 1,
  }));

  return {
    answer,
    citations,
  };
}

// Query the RAG system with streaming
export async function* queryRAGStream(question: string): AsyncGenerator<{ type: 'token' | 'citations'; data: any }, void, unknown> {
  console.log(`RAG streaming query: "${question}"`);

  // Generate embedding for the question
  const questionEmbedding = await generateEmbedding(question);

  // Search for relevant chunks
  const relevantChunks = await storage.searchChunksByEmbedding(questionEmbedding, 5);

  console.log(`Found ${relevantChunks.length} relevant chunks`);

  // Create citations from relevant chunks
  const citations: Citation[] = relevantChunks.map((chunk) => ({
    source: chunk.metadata?.fileName || 'Unknown Source',
    excerpt: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    confidence: 0.85,
    page: chunk.chunkIndex + 1,
  }));

  // Send citations first
  yield { type: 'citations', data: citations };

  if (relevantChunks.length === 0) {
    // No indexed documents yet
    const fallbackMessage = "I don't have any medical documents indexed yet to answer your question. Please upload medical datasets to Google Drive and index them first, or I can provide general medical information based on my training.";
    for (const char of fallbackMessage) {
      yield { type: 'token', data: char };
    }
    return;
  }

  // Build context from relevant chunks
  const context = relevantChunks
    .map((chunk, idx) => `[Source ${idx + 1}: ${chunk.metadata?.fileName || 'Unknown'}]\n${chunk.content}`)
    .join('\n\n---\n\n');

  // Stream response using GPT-5
  for await (const token of generateChatCompletionStream(question, context)) {
    yield { type: 'token', data: token };
  }
}

// Check if we have any indexed documents
export async function hasIndexedDocuments(): Promise<boolean> {
  const chunks = await storage.getAllChunks();
  return chunks.length > 0;
}

// Get stats about indexed documents
export async function getIndexStats(): Promise<{ totalChunks: number; uniqueDocuments: number }> {
  const chunks = await storage.getAllChunks();
  const uniqueDocIds = new Set(chunks.map(c => c.documentId));
  
  return {
    totalChunks: chunks.length,
    uniqueDocuments: uniqueDocIds.size,
  };
}
