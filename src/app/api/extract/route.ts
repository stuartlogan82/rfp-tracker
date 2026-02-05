import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractText } from '@/lib/file-parser';
import { extractDates, extractDatesFromImage } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    // Validate input
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Fetch document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Extract text or identify as image
    const extractionResult = await extractText(document.filepath, document.mimeType);

    // Extract dates using appropriate method
    let dates;
    if (extractionResult.isImage) {
      // Use vision API for images
      dates = await extractDatesFromImage(document.filepath);
    } else {
      // Use text extraction for documents
      dates = await extractDates(extractionResult.text);
    }

    return NextResponse.json({ dates }, { status: 200 });
  } catch (error) {
    console.error('Error extracting dates:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract dates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
