/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET, DELETE } from './route';
import { prisma } from '@/lib/db';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?mock=true'),
        setCredentials: jest.fn(),
        revokeToken: jest.fn().mockResolvedValue({}),
      })),
    },
  },
}));

describe('GET /api/auth/google', () => {
  it('returns a redirect to Google OAuth URL', async () => {
    const response = await GET();

    expect(response.status).toBe(307); // NextResponse.redirect uses 307
    expect(response.headers.get('Location')).toContain('accounts.google.com');
  });
});

describe('DELETE /api/auth/google', () => {
  beforeEach(async () => {
    await prisma.googleAuth.deleteMany();
  });

  it('deletes GoogleAuth record and returns 200 when record exists', async () => {
    // Create a GoogleAuth record
    await prisma.googleAuth.create({
      data: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date('2026-03-15T12:00:00Z'),
      },
    });

    const response = await DELETE();

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.message).toBeDefined();

    // Verify record was deleted
    const records = await prisma.googleAuth.findMany();
    expect(records).toHaveLength(0);
  });

  it('returns 404 when no GoogleAuth record exists', async () => {
    const response = await DELETE();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
