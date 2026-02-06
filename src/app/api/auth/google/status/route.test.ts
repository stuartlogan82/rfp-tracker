/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from './route';
import { prisma } from '@/lib/db';

describe('GET /api/auth/google/status', () => {
  beforeEach(async () => {
    await prisma.googleAuth.deleteMany();
  });

  it('returns connected: true when GoogleAuth record exists', async () => {
    await prisma.googleAuth.create({
      data: {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date('2026-03-15'),
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.connected).toBe(true);
  });

  it('returns connected: false when no GoogleAuth record exists', async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.connected).toBe(false);
  });
});
