import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as fs from 'fs/promises';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Sanitizes a filename to prevent directory traversal attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove any path components and dangerous characters
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Ensures the uploads directory exists
 */
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * POST /api/upload
 * Handles file uploads and saves them to the uploads directory
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rfpIdStr = formData.get('rfpId') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate rfpId
    if (!rfpIdStr) {
      return NextResponse.json({ error: 'No rfpId provided' }, { status: 400 });
    }

    const rfpId = parseInt(rfpIdStr, 10);
    if (isNaN(rfpId)) {
      return NextResponse.json({ error: 'Invalid rfpId' }, { status: 400 });
    }

    // Check if RFP exists
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Ensure uploads directory exists
    await ensureUploadsDir();

    // Generate unique filename to avoid collisions
    const sanitizedFilename = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const filepath = path.join(UPLOADS_DIR, uniqueFilename);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        rfpId,
        filename: file.name,
        filepath,
        mimeType: file.type || 'application/octet-stream',
      },
    });

    return NextResponse.json({ document }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
