/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { GET, PUT, DELETE } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('GET /api/rfps/[id]', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('returns a single RFP with its deadlines and documents', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        status: 'Active',
        deadlines: {
          create: [
            {
              date: new Date('2026-03-01'),
              label: 'Submission Deadline',
            },
            {
              date: new Date('2026-02-15'),
              label: 'Q&A Deadline',
            },
          ],
        },
        documents: {
          create: {
            filename: 'test.pdf',
            filepath: '/uploads/test.pdf',
            mimeType: 'application/pdf',
          },
        },
      },
    });

    const response = await GET(
      new NextRequest('http://localhost:3000/api/rfps/1'),
      { params: Promise.resolve({ id: rfp.id.toString() }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rfp).toMatchObject({
      id: rfp.id,
      name: 'Test RFP',
      agency: 'Test Agency',
      status: 'Active',
    });
    expect(data.rfp.deadlines).toHaveLength(2);
    expect(data.rfp.documents).toHaveLength(1);
  });

  it('returns 404 when RFP does not exist', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/rfps/999'),
      { params: Promise.resolve({ id: '999' }) }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('RFP not found');
  });

  it('returns 400 for invalid ID', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/rfps/invalid'),
      { params: Promise.resolve({ id: 'invalid' }) }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid RFP ID');
  });
});

describe('PUT /api/rfps/[id]', () => {
  beforeEach(async () => {
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('updates an RFP with valid data', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Original Name',
        agency: 'Original Agency',
        status: 'Active',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/rfps/1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Name',
        agency: 'Updated Agency',
        status: 'Won',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: rfp.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rfp).toMatchObject({
      id: rfp.id,
      name: 'Updated Name',
      agency: 'Updated Agency',
      status: 'Won',
    });

    // Verify database was updated
    const updated = await prisma.rfp.findUnique({ where: { id: rfp.id } });
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.agency).toBe('Updated Agency');
    expect(updated?.status).toBe('Won');
  });

  it('allows partial updates (only name)', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Original Name',
        agency: 'Original Agency',
        status: 'Active',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/rfps/1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Name',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: rfp.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rfp.name).toBe('Updated Name');
    expect(data.rfp.agency).toBe('Original Agency'); // Unchanged
    expect(data.rfp.status).toBe('Active'); // Unchanged
  });

  it('returns 404 when RFP does not exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfps/999', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Name',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: '999' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('RFP not found');
  });

  it('returns 400 for invalid status', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        status: 'Active',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/rfps/1', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'InvalidStatus',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: rfp.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Status must be one of');
  });

  it('returns 400 for invalid ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfps/invalid', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Name',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'invalid' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid RFP ID');
  });
});

describe('DELETE /api/rfps/[id]', () => {
  beforeEach(async () => {
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('deletes an RFP and returns 204', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        status: 'Active',
      },
    });

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/rfps/1'),
      { params: Promise.resolve({ id: rfp.id.toString() }) }
    );

    expect(response.status).toBe(204);

    // Verify it was actually deleted
    const deleted = await prisma.rfp.findUnique({ where: { id: rfp.id } });
    expect(deleted).toBeNull();
  });

  it('cascades delete to deadlines and documents', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        deadlines: {
          create: {
            date: new Date('2026-03-01'),
            label: 'Test Deadline',
          },
        },
        documents: {
          create: {
            filename: 'test.pdf',
            filepath: '/uploads/test.pdf',
            mimeType: 'application/pdf',
          },
        },
      },
    });

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/rfps/1'),
      { params: Promise.resolve({ id: rfp.id.toString() }) }
    );

    expect(response.status).toBe(204);

    // Verify cascade delete worked
    const deadlines = await prisma.deadline.findMany({ where: { rfpId: rfp.id } });
    const documents = await prisma.document.findMany({ where: { rfpId: rfp.id } });
    expect(deadlines).toHaveLength(0);
    expect(documents).toHaveLength(0);
  });

  it('returns 404 when RFP does not exist', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/rfps/999'),
      { params: Promise.resolve({ id: '999' }) }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('RFP not found');
  });

  it('returns 400 for invalid ID', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/rfps/invalid'),
      { params: Promise.resolve({ id: 'invalid' }) }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid RFP ID');
  });
});
