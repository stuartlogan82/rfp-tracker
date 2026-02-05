/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET, POST } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('GET /api/rfps', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('returns an empty list when no RFPs exist', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ rfps: [] });
  });

  it('returns a list of all RFPs', async () => {
    // Create test RFPs
    await prisma.rfp.create({
      data: {
        name: 'Test RFP 1',
        agency: 'Agency A',
        status: 'Active',
      },
    });
    await prisma.rfp.create({
      data: {
        name: 'Test RFP 2',
        agency: 'Agency B',
        status: 'Won',
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rfps).toHaveLength(2);
    expect(data.rfps[0]).toMatchObject({
      name: expect.any(String),
      agency: expect.any(String),
      status: expect.any(String),
    });
  });

  it('includes deadlines and documents in the response', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        deadlines: {
          create: {
            date: new Date('2026-03-01'),
            label: 'Submission Deadline',
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rfps[0].deadlines).toHaveLength(1);
    expect(data.rfps[0].documents).toHaveLength(1);
  });

  it('orders RFPs by createdAt descending (most recent first)', async () => {
    // Create RFPs with slight delay to ensure different timestamps
    const rfp1 = await prisma.rfp.create({
      data: {
        name: 'First RFP',
        agency: 'Agency A',
      },
    });

    // Wait a tiny bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const rfp2 = await prisma.rfp.create({
      data: {
        name: 'Second RFP',
        agency: 'Agency B',
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rfps[0].name).toBe('Second RFP'); // Most recent first
    expect(data.rfps[1].name).toBe('First RFP');
  });
});

describe('POST /api/rfps', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('creates a new RFP with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfps', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New RFP',
        agency: 'Test Agency',
        status: 'Active',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.rfp).toMatchObject({
      id: expect.any(Number),
      name: 'New RFP',
      agency: 'Test Agency',
      status: 'Active',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // Verify it was actually created in the database
    const rfp = await prisma.rfp.findUnique({ where: { id: data.rfp.id } });
    expect(rfp).not.toBeNull();
    expect(rfp?.name).toBe('New RFP');
  });

  it('defaults status to Active when not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfps', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New RFP',
        agency: 'Test Agency',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.rfp.status).toBe('Active');
  });

  it('returns 400 when name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfps', {
      method: 'POST',
      body: JSON.stringify({
        agency: 'Test Agency',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name and agency are required');
  });

  it('returns 400 when agency is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfps', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New RFP',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name and agency are required');
  });

  it('returns 400 when status is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfps', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New RFP',
        agency: 'Test Agency',
        status: 'InvalidStatus',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Status must be one of');
  });

  it('accepts all valid status values', async () => {
    const validStatuses = ['Active', 'Won', 'Lost', 'NoBid', 'Archived'];

    for (const status of validStatuses) {
      const request = new NextRequest('http://localhost:3000/api/rfps', {
        method: 'POST',
        body: JSON.stringify({
          name: `RFP with ${status}`,
          agency: 'Test Agency',
          status,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.rfp.status).toBe(status);
    }
  });
});
