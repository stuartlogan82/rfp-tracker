import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/auth/google/status
 * Returns whether Google Calendar is connected
 */
export async function GET() {
  try {
    const googleAuth = await prisma.googleAuth.findFirst();

    return NextResponse.json({
      connected: !!googleAuth,
    });
  } catch (error) {
    console.error('Error checking Google auth status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
