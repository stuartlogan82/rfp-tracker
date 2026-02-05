import OpenAI from 'openai';
import { readFileSync } from 'fs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedDate {
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM or null
  label: string;
  context: string;
}

// Approximate token limit per chunk (GPT-4o has ~128k context, but we leave room for system prompt and response)
const MAX_CHARS_PER_CHUNK = 50000; // Roughly ~12,500 tokens
const CHUNK_OVERLAP = 500; // Character overlap between chunks to catch dates that span boundaries

const SYSTEM_PROMPT = `You are a helpful assistant that extracts dates and deadlines from RFP (Request for Proposal) documents.

Extract ALL dates mentioned in the document, including:
- Submission deadlines
- Question/clarification deadlines
- Site visit dates
- Pre-bid meeting dates
- Contract start/end dates
- Any other milestone dates

For each date found, provide:
1. date: in YYYY-MM-DD format
2. time: in HH:MM format (24-hour) if specified, otherwise null
3. label: a brief description of what the deadline is for
4. context: additional context or requirements related to this date

Return your response as a JSON object with a "dates" array containing objects with these fields.

If no dates are found, return an empty dates array.`;

/**
 * Split text into chunks with overlap
 */
function chunkText(text: string): string[] {
  if (text.length <= MAX_CHARS_PER_CHUNK) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + MAX_CHARS_PER_CHUNK, text.length);
    chunks.push(text.substring(start, end));
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Deduplicate extracted dates based on date and label
 */
function deduplicateDates(dates: ExtractedDate[]): ExtractedDate[] {
  const seen = new Map<string, ExtractedDate>();

  for (const date of dates) {
    const key = `${date.date}|${date.label}`;
    if (!seen.has(key)) {
      seen.set(key, date);
    }
  }

  return Array.from(seen.values());
}

/**
 * Extract dates from a single text chunk
 */
async function extractDatesFromChunk(text: string): Promise<ExtractedDate[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content);
  return parsed.dates || [];
}

/**
 * Extract dates from text using OpenAI GPT-4o
 * Handles large documents by chunking and merging results
 */
export async function extractDates(text: string): Promise<ExtractedDate[]> {
  try {
    const chunks = chunkText(text);
    const allDates: ExtractedDate[] = [];

    // Process each chunk
    for (const chunk of chunks) {
      const dates = await extractDatesFromChunk(chunk);
      allDates.push(...dates);
    }

    // Deduplicate dates that may appear in multiple chunks
    return deduplicateDates(allDates);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    throw error;
  }
}

/**
 * Extract dates from image files using OpenAI GPT-4o Vision
 */
export async function extractDatesFromImage(filepath: string): Promise<ExtractedDate[]> {
  try {
    // Read the image file and convert to base64
    const imageBuffer = readFileSync(filepath);
    const base64Image = imageBuffer.toString('base64');

    // Determine mime type from file extension
    const ext = filepath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
    };
    const mimeType = mimeTypes[ext || ''] || 'image/png';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all dates and deadlines from this document image.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed.dates || [];
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    throw error;
  }
}
