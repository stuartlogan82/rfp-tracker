/**
 * @jest-environment node
 */
import { POST } from './route';
import { prisma } from '@/lib/db';
import * as fs from 'fs/promises';
import * as path from 'path';
import { NextRequest } from 'next/server';

describe('POST /api/upload', () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  beforeEach(async () => {
    // Clean up database
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();

    // Clean up uploads directory
    try {
      await fs.rm(uploadsDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 400 when no file is provided', async () => {
    const formData = new FormData();
    formData.append('rfpId', '1');

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('file');
  });

  it('returns 400 when no rfpId is provided', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('rfpId');
  });

  it('returns 404 when RFP does not exist', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('rfpId', '99999');

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('RFP');
  });

  it('uploads a file, saves it to disk, and creates a document record', async () => {
    // Create an RFP first
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        status: 'Active',
      },
    });

    const fileContent = 'Test PDF content';
    const file = new File([fileContent], 'test-document.pdf', {
      type: 'application/pdf',
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('rfpId', rfp.id.toString());

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.document).toBeDefined();
    expect(data.document.filename).toBe('test-document.pdf');
    expect(data.document.mimeType).toBe('application/pdf');
    expect(data.document.rfpId).toBe(rfp.id);
    expect(data.document.filepath).toContain('uploads/');

    // Verify document was saved to database
    const dbDocument = await prisma.document.findUnique({
      where: { id: data.document.id },
    });
    expect(dbDocument).toBeDefined();
    expect(dbDocument?.filename).toBe('test-document.pdf');

    // Verify file was saved to disk
    const fileExists = await fs
      .access(data.document.filepath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);

    // Verify file content
    const savedContent = await fs.readFile(data.document.filepath, 'utf-8');
    expect(savedContent).toBe(fileContent);
  });

  it('sanitizes filename to prevent directory traversal', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        status: 'Active',
      },
    });

    const file = new File(['content'], '../../../etc/passwd', {
      type: 'text/plain',
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('rfpId', rfp.id.toString());

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.document.filepath).not.toContain('..');
    expect(data.document.filepath).toContain('uploads/');
  });
});
