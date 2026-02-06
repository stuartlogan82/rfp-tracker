/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock googleapis
const mockGetToken = jest.fn();
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        getToken: mockGetToken,
      })),
    },
  },
}));

describe('GET /api/auth/google/callback', () => {
  beforeEach(async () => {
    await prisma.googleAuth.deleteMany();
    jest.clearAllMocks();
  });

  it('exchanges code for tokens, stores in database, and redirects to dashboard', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    mockGetToken.mockResolvedValue({
      tokens: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expiry_date: futureDate.getTime(),
      },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/auth/google/callback?code=mock_code'
    );

    const response = await GET(request);

    expect(response.status).toBe(307); // NextResponse.redirect uses 307
    expect(response.headers.get('Location')).toBe('http://localhost:3000/');

    // Verify token was exchanged
    expect(mockGetToken).toHaveBeenCalledWith('mock_code');

    // Verify record was created in database
    const googleAuth = await prisma.googleAuth.findFirst();
    expect(googleAuth).toBeDefined();
    expect(googleAuth?.accessToken).toBe('mock-access-token');
    expect(googleAuth?.refreshToken).toBe('mock-refresh-token');
  });

  it('returns 400 when code parameter is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/google/callback'
    );

    const response = await GET(request);

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it('updates existing GoogleAuth record if one already exists', async () => {
    // Create an existing record
    await prisma.googleAuth.create({
      data: {
        accessToken: 'old-token',
        refreshToken: 'old-refresh',
        expiresAt: new Date('2026-01-01'),
      },
    });

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    mockGetToken.mockResolvedValue({
      tokens: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expiry_date: futureDate.getTime(),
      },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/auth/google/callback?code=mock_code'
    );

    await GET(request);

    // Verify only one record exists with new tokens
    const records = await prisma.googleAuth.findMany();
    expect(records).toHaveLength(1);
    expect(records[0].accessToken).toBe('new-access-token');
    expect(records[0].refreshToken).toBe('new-refresh-token');
  });
});
