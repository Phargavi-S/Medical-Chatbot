import mammoth from "mammoth";
import { downloadDriveFile, getFileMetadata } from "../lib/googleDrive";

// pdf-parse doesn't have ESM support, use dynamic import
const getPdfParse = async () => {
  const pdfParse = await import("pdf-parse");
  return pdfParse.default || pdfParse;
};

export interface ProcessedDocument {
  fileId: string;
  fileName: string;
  mimeType: string;
  content: string;
  chunks: string[];
}

// Extract text from PDF buffer
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

// Extract text from DOCX buffer
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: any) {
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
}

// Extract text from plain text buffer
function extractPlainText(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

// Split text into chunks for embedding
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+\s+/);
  
  let currentChunk = "";
  let previousChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Keep overlap from previous chunk
        previousChunk = currentChunk.slice(-overlap);
        currentChunk = previousChunk + " " + trimmedSentence;
      } else {
        // Single sentence is longer than chunk size, add it anyway
        chunks.push(trimmedSentence);
        currentChunk = "";
      }
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmedSentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
}

// Process a document from Google Drive
export async function processDocument(fileId: string): Promise<ProcessedDocument> {
  try {
    // Get file metadata
    const metadata = await getFileMetadata(fileId);
    const fileName = metadata.name || 'unknown';
    const mimeType = metadata.mimeType || 'unknown';

    console.log(`Processing document: ${fileName} (${mimeType})`);

    // Download file
    const buffer = await downloadDriveFile(fileId);

    // Extract text based on file type
    let content: string;
    
    if (mimeType === 'application/pdf') {
      content = await extractPdfText(buffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      content = await extractDocxText(buffer);
    } else if (mimeType === 'text/plain') {
      content = extractPlainText(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim();

    // Split into chunks
    const chunks = chunkText(content);

    console.log(`Extracted ${chunks.length} chunks from ${fileName}`);

    return {
      fileId,
      fileName,
      mimeType,
      content,
      chunks,
    };
  } catch (error: any) {
    console.error(`Error processing document ${fileId}:`, error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
}
