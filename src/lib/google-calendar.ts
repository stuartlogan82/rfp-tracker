import { google } from 'googleapis';
import { prisma } from './db';

interface DeadlineForCalendar {
  date: Date | string;
  time: string | null;
  label: string;
  context: string | null;
  rfpName: string;
}

/**
 * Gets an authenticated Google Calendar client
 * Handles token refresh if expired
 * Returns null if no GoogleAuth record exists
 */
export async function getAuthenticatedClient() {
  try {
    const googleAuth = await prisma.googleAuth.findFirst();

    if (!googleAuth) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: googleAuth.accessToken,
      refresh_token: googleAuth.refreshToken,
    });

    // Check if token is expired
    const now = new Date();
    if (googleAuth.expiresAt < now) {
      // Token is expired, refresh it
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (credentials.access_token && credentials.expiry_date) {
        // Update database with new token
        await prisma.googleAuth.update({
          where: { id: googleAuth.id },
          data: {
            accessToken: credentials.access_token,
            expiresAt: new Date(credentials.expiry_date),
          },
        });

        oauth2Client.setCredentials({
          access_token: credentials.access_token,
          refresh_token: googleAuth.refreshToken,
        });
      }
    }

    return oauth2Client;
  } catch (error) {
    console.error('Error getting authenticated client:', error);
    throw error;
  }
}

/**
 * Creates a Google Calendar event from a deadline
 * Returns the Google event ID
 */
export async function createCalendarEvent(
  deadline: DeadlineForCalendar
): Promise<string> {
  const client = await getAuthenticatedClient();

  if (!client) {
    throw new Error('Not connected to Google Calendar');
  }

  const calendar = google.calendar({ version: 'v3', auth: client });

  const date = typeof deadline.date === 'string' ? new Date(deadline.date) : deadline.date;

  // Format date as YYYY-MM-DD
  const dateStr = date.toISOString().split('T')[0];

  let start, end;

  if (deadline.time) {
    // Timed event - use dateTime format
    const dateTimeStr = `${dateStr}T${deadline.time}:00`;

    // Add 1 hour for end time
    const endDate = new Date(dateTimeStr);
    endDate.setHours(endDate.getHours() + 1);
    const endDateTimeStr = endDate.toISOString().split('.')[0];

    start = {
      dateTime: dateTimeStr,
      timeZone: 'Europe/London',
    };
    end = {
      dateTime: endDateTimeStr,
      timeZone: 'Europe/London',
    };
  } else {
    // All-day event - use date format
    start = { date: dateStr };
    end = { date: dateStr };
  }

  const event = {
    summary: `${deadline.label} - ${deadline.rfpName}`,
    description: deadline.context || '',
    start,
    end,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup' as const, minutes: 1440 }, // 24 hours
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  if (!response.data.id) {
    throw new Error('Failed to create calendar event');
  }

  return response.data.id;
}

/**
 * Updates an existing Google Calendar event
 */
export async function updateCalendarEvent(
  googleEventId: string,
  deadline: DeadlineForCalendar
): Promise<void> {
  const client = await getAuthenticatedClient();

  if (!client) {
    throw new Error('Not connected to Google Calendar');
  }

  const calendar = google.calendar({ version: 'v3', auth: client });

  const date = typeof deadline.date === 'string' ? new Date(deadline.date) : deadline.date;
  const dateStr = date.toISOString().split('T')[0];

  let start, end;

  if (deadline.time) {
    const dateTimeStr = `${dateStr}T${deadline.time}:00`;
    const endDate = new Date(dateTimeStr);
    endDate.setHours(endDate.getHours() + 1);
    const endDateTimeStr = endDate.toISOString().split('.')[0];

    start = {
      dateTime: dateTimeStr,
      timeZone: 'Europe/London',
    };
    end = {
      dateTime: endDateTimeStr,
      timeZone: 'Europe/London',
    };
  } else {
    start = { date: dateStr };
    end = { date: dateStr };
  }

  const event = {
    summary: `${deadline.label} - ${deadline.rfpName}`,
    description: deadline.context || '',
    start,
    end,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup' as const, minutes: 1440 },
      ],
    },
  };

  await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: event,
  });
}

/**
 * Deletes a Google Calendar event
 */
export async function deleteCalendarEvent(
  googleEventId: string
): Promise<void> {
  const client = await getAuthenticatedClient();

  if (!client) {
    throw new Error('Not connected to Google Calendar');
  }

  const calendar = google.calendar({ version: 'v3', auth: client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  });
}
