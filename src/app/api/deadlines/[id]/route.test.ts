/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PUT, DELETE } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('PUT /api/deadlines/[id]', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('updates a deadline with all fields', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        deadlines: {
          create: {
            date: new Date('2026-03-01'),
            label: 'Original Label',
            completed: false,
          },
        },
      },
    });

    const deadline = await prisma.deadline.findFirst({
      where: { rfpId: rfp.id },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines/1', {
      method: 'PUT',
      body: JSON.stringify({
        date: '2026-03-15T00:00:00.000Z',
        time: '14:00',
        label: 'Updated Label',
        context: 'Updated context',
        completed: true,
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: deadline!.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deadline).toMatchObject({
      id: deadline!.id,
      label: 'Updated Label',
      time: '14:00',
      context: 'Updated context',
      completed: true,
    });

    // Verify database was updated
    const updated = await prisma.deadline.findUnique({
      where: { id: deadline!.id },
    });
    expect(updated?.label).toBe('Updated Label');
    expect(updated?.completed).toBe(true);
  });

  it('allows partial updates (only label)', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        deadlines: {
          create: {
            date: new Date('2026-03-01'),
            time: '10:00',
            label: 'Original Label',
            context: 'Original context',
            completed: false,
          },
        },
      },
    });

    const deadline = await prisma.deadline.findFirst({
      where: { rfpId: rfp.id },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines/1', {
      method: 'PUT',
      body: JSON.stringify({
        label: 'Updated Label Only',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: deadline!.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deadline.label).toBe('Updated Label Only');
    expect(data.deadline.time).toBe('10:00'); // Unchanged
    expect(data.deadline.context).toBe('Original context'); // Unchanged
    expect(data.deadline.completed).toBe(false); // Unchanged
  });

  it('can toggle completed status', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        deadlines: {
          create: {
            date: new Date('2026-03-01'),
            label: 'Test Deadline',
            completed: false,
          },
        },
      },
    });

    const deadline = await prisma.deadline.findFirst({
      where: { rfpId: rfp.id },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines/1', {
      method: 'PUT',
      body: JSON.stringify({
        completed: true,
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: deadline!.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deadline.completed).toBe(true);
  });

  it('can clear optional fields by setting to null', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
        deadlines: {
          create: {
            date: new Date('2026-03-01'),
            time: '10:00',
            label: 'Test Deadline',
            context: 'Some context',
          },
        },
      },
    });

    const deadline = await prisma.deadline.findFirst({
      where: { rfpId: rfp.id },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines/1', {
      method: 'PUT',
      body: JSON.stringify({
        time: null,
        context: null,
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: deadline!.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deadline.time).toBeNull();
    expect(data.deadline.context).toBeNull();
  });

  it('returns 404 when deadline does not exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/deadlines/999', {
      method: 'PUT',
      body: JSON.stringify({
        label: 'Updated Label',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: '999' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Deadline not found');
  });

  it('returns 400 for invalid ID', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/deadlines/invalid',
      {
        method: 'PUT',
        body: JSON.stringify({
          label: 'Updated Label',
        }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'invalid' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid deadline ID');
  });

  it('returns 400 for invalid date format', async () => {
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
      },
    });

    const deadline = await prisma.deadline.findFirst({
      where: { rfpId: rfp.id },
    });

    const request = new NextRequest('http://localhost:3000/api/deadlines/1', {
      method: 'PUT',
      body: JSON.stringify({
        date: 'invalid-date',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: deadline!.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid date format');
  });
});

describe('DELETE /api/deadlines/[id]', () => {
  beforeEach(async () => {
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  it('deletes a deadline and returns 204', async () => {
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
      },
    });

    const deadline = await prisma.deadline.findFirst({
      where: { rfpId: rfp.id },
    });

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/deadlines/1'),
      { params: Promise.resolve({ id: deadline!.id.toString() }) }
    );

    expect(response.status).toBe(204);

    // Verify it was actually deleted
    const deleted = await prisma.deadline.findUnique({
      where: { id: deadline!.id },
    });
    expect(deleted).toBeNull();
  });

  it('returns 404 when deadline does not exist', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/deadlines/999'),
      { params: Promise.resolve({ id: '999' }) }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Deadline not found');
  });

  it('returns 400 for invalid ID', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/deadlines/invalid'),
      { params: Promise.resolve({ id: 'invalid' }) }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid deadline ID');
  });
});
