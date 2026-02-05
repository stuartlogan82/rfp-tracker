/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { POST } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('POST /api/deadlines', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('creates a new deadline with all fields', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        rfpId: rfp.id,
        date: '2026-03-01T00:00:00.000Z',
        time: '14:00',
        label: 'Submission Deadline',
        context: 'Final submission of all documents',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.deadline).toMatchObject({
      id: expect.any(Number),
      rfpId: rfp.id,
      date: expect.any(String),
      time: '14:00',
      label: 'Submission Deadline',
      context: 'Final submission of all documents',
      completed: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // Verify it was actually created in the database
    const deadline = await prisma.deadline.findUnique({
      where: { id: data.deadline.id },
    });
    expect(deadline).not.toBeNull();
    expect(deadline?.label).toBe('Submission Deadline');
  });

  it('creates a deadline without optional fields (time, context)', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        rfpId: rfp.id,
        date: '2026-03-01T00:00:00.000Z',
        label: 'Q&A Session',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.deadline.time).toBeNull();
    expect(data.deadline.context).toBeNull();
    expect(data.deadline.label).toBe('Q&A Session');
  });

  it('defaults completed to false', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        rfpId: rfp.id,
        date: '2026-03-01T00:00:00.000Z',
        label: 'Test Deadline',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.deadline.completed).toBe(false);
  });

  it('returns 400 when rfpId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-03-01T00:00:00.000Z',
        label: 'Test Deadline',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('RFP ID, date, and label are required');
  });

  it('returns 400 when date is missing', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        rfpId: rfp.id,
        label: 'Test Deadline',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('RFP ID, date, and label are required');
  });

  it('returns 400 when label is missing', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        rfpId: rfp.id,
        date: '2026-03-01T00:00:00.000Z',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('RFP ID, date, and label are required');
  });

  it('returns 400 when RFP does not exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        rfpId: 999,
        date: '2026-03-01T00:00:00.000Z',
        label: 'Test Deadline',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('RFP not found');
  });

  it('returns 400 for invalid date format', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines', {
      method: 'POST',
      body: JSON.stringify({
        rfpId: rfp.id,
        date: 'invalid-date',
        label: 'Test Deadline',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid date format');
  });
});
