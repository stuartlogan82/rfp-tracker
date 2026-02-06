import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db';

/**
 * GET /api/auth/google
 * Initiates the Google OAuth flow by redirecting to Google's auth URL
 */
export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent', // Force consent to get refresh token
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/google
 * Disconnects Google Calendar by revoking tokens and deleting from database
 */
export async function DELETE() {
  try {
    const googleAuth = await prisma.googleAuth.findFirst();

    if (!googleAuth) {
      return NextResponse.json(
        { error: 'Not connected to Google Calendar' },
        { status: 404 }
      );
    }

    // Best-effort token revocation
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: googleAuth.accessToken,
      });
      await oauth2Client.revokeToken(googleAuth.accessToken);
    } catch (revokeError) {
      // Continue even if revocation fails (token may already be expired)
      console.warn('Token revocation failed (continuing):', revokeError);
    }

    // Delete from database
    await prisma.googleAuth.delete({
      where: { id: googleAuth.id },
    });

    return NextResponse.json({
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
