// Reference: blueprint:javascript_openai integration
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

import OpenAI from "openai";

// This is using OpenAI's API, which points to OpenAI's API servers and requires your own API key.
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate embeddings for text chunks (for RAG vector search)
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

// Generate embeddings for multiple texts in batch
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error: any) {
    console.error("Error generating embeddings:", error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

// Generate chat completion with RAG context
export async function generateChatCompletion(
  userMessage: string,
  context: string,
): Promise<string> {
  try {
    const systemPrompt = `You are HealSage, a knowledgeable medical AI assistant. Your role is to provide accurate, evidence-based health information to users.

IMPORTANT GUIDELINES:
1. Base your responses on the provided medical context/sources
2. Be clear, professional, and compassionate
3. Always remind users that you provide information, not medical advice
4. Suggest consulting healthcare professionals for diagnosis and treatment
5. If unsure or if the context doesn't contain relevant information, be honest about limitations
6. Use simple, easy-to-understand language
7. Structure responses clearly with proper formatting

CONTEXT FROM MEDICAL SOURCES:
${context}

Provide a helpful, accurate response based on this context.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_completion_tokens: 8192,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error("Error generating chat completion:", error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

// Generate chat completion with streaming
export async function* generateChatCompletionStream(
  userMessage: string,
  context: string,
): AsyncGenerator<string, void, unknown> {
  try {
    const systemPrompt = `You are HealSage, a knowledgeable medical AI assistant. Your role is to provide accurate, evidence-based health information to users.

IMPORTANT GUIDELINES:
1. Base your responses on the provided medical context/sources
2. Be clear, professional, and compassionate
3. Always remind users that you provide information, not medical advice
4. Suggest consulting healthcare professionals for diagnosis and treatment
5. If unsure or if the context doesn't contain relevant information, be honest about limitations
6. Use simple, easy-to-understand language
7. Structure responses clearly with proper formatting

CONTEXT FROM MEDICAL SOURCES:
${context}

Provide a helpful, accurate response based on this context.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_completion_tokens: 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    console.error("Error generating streaming chat completion:", error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}
