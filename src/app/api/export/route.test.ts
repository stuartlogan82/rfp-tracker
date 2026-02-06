/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('GET /api/export', () => {
  beforeEach(async () => {
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  describe('single deadline export (?deadlineId=<id>)', () => {
    it('returns 200 with text/calendar content type and ICS body', async () => {
      const rfp = await prisma.rfp.create({
        data: { name: 'NHS RFP', agency: 'NHS England' },
      });
      const deadline = await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15T00:00:00.000Z'),
          time: '14:00',
          label: 'Proposal Due',
          context: 'Submit via portal',
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/export?deadlineId=${deadline.id}`
      );
      const response = await GET(request);
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/calendar');
      expect(body).toContain('BEGIN:VCALENDAR');
    });

    it('returns Content-Disposition header with attachment and .ics filename', async () => {
      const rfp = await prisma.rfp.create({
        data: { name: 'NHS RFP', agency: 'NHS England' },
      });
      const deadline = await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15T00:00:00.000Z'),
          time: '14:00',
          label: 'Proposal Due',
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/export?deadlineId=${deadline.id}`
      );
      const response = await GET(request);
      const disposition = response.headers.get('Content-Disposition');

      expect(disposition).toContain('attachment');
      expect(disposition).toMatch(/\.ics/);
    });

    it('returns 404 for non-existent deadline ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/export?deadlineId=999'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('returns 400 for invalid (non-numeric) deadline ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/export?deadlineId=abc'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('bulk export (no deadlineId param)', () => {
    it('returns ICS with multiple VEVENTs for incomplete deadlines from Active RFPs', async () => {
      const activeRfp = await prisma.rfp.create({
        data: { name: 'Active RFP', agency: 'Agency A', status: 'Active' },
      });
      const wonRfp = await prisma.rfp.create({
        data: { name: 'Won RFP', agency: 'Agency B', status: 'Won' },
      });

      // Active RFP: 2 incomplete, 1 completed
      await prisma.deadline.create({
        data: {
          rfpId: activeRfp.id,
          date: new Date('2026-03-15T00:00:00.000Z'),
          label: 'Submission',
        },
      });
      await prisma.deadline.create({
        data: {
          rfpId: activeRfp.id,
          date: new Date('2026-04-01T00:00:00.000Z'),
          label: 'Presentation',
        },
      });
      await prisma.deadline.create({
        data: {
          rfpId: activeRfp.id,
          date: new Date('2026-02-01T00:00:00.000Z'),
          label: 'Completed One',
          completed: true,
        },
      });

      // Won RFP: should be excluded
      await prisma.deadline.create({
        data: {
          rfpId: wonRfp.id,
          date: new Date('2026-03-20T00:00:00.000Z'),
          label: 'Won Deadline',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/export');
      const response = await GET(request);
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/calendar');

      // Should contain exactly 2 VEVENTs (incomplete from Active RFP only)
      const eventMatches = body.match(/BEGIN:VEVENT/g);
      expect(eventMatches).toHaveLength(2);

      expect(body).toContain('Submission');
      expect(body).toContain('Presentation');
      expect(body).not.toContain('Completed One');
      expect(body).not.toContain('Won Deadline');
    });

    it('returns 404 when there are no qualifying deadlines', async () => {
      // Create an RFP with only completed deadlines
      const rfp = await prisma.rfp.create({
        data: { name: 'Test RFP', agency: 'Test Agency', status: 'Active' },
      });
      await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15T00:00:00.000Z'),
          label: 'Done',
          completed: true,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/export');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });
});
