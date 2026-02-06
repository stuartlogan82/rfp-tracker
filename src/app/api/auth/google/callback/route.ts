import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db';

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback, exchanges code for tokens, and stores in database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code missing' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      return NextResponse.json(
        { error: 'Failed to obtain tokens' },
        { status: 500 }
      );
    }

    const expiresAt = new Date(tokens.expiry_date);

    // Upsert GoogleAuth record (update if exists, create if not)
    const existingAuth = await prisma.googleAuth.findFirst();

    if (existingAuth) {
      await prisma.googleAuth.update({
        where: { id: existingAuth.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    } else {
      await prisma.googleAuth.create({
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
