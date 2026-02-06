import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from './db';

// Mock googleapis with factory functions
const mockSetCredentials = jest.fn();
const mockRefreshAccessToken = jest.fn();
const mockEventsInsert = jest.fn();
const mockEventsUpdate = jest.fn();
const mockEventsDelete = jest.fn();

jest.mock('googleapis', () => {
  const mockSetCredentials = jest.fn();
  const mockRefreshAccessToken = jest.fn();
  const mockEventsInsert = jest.fn();
  const mockEventsUpdate = jest.fn();
  const mockEventsDelete = jest.fn();

  // Export these so tests can access them
  (global as any).mockSetCredentials = mockSetCredentials;
  (global as any).mockRefreshAccessToken = mockRefreshAccessToken;
  (global as any).mockEventsInsert = mockEventsInsert;
  (global as any).mockEventsUpdate = mockEventsUpdate;
  (global as any).mockEventsDelete = mockEventsDelete;

  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: mockSetCredentials,
          refreshAccessToken: mockRefreshAccessToken,
        })),
      },
      calendar: jest.fn().mockReturnValue({
        events: {
          insert: mockEventsInsert,
          update: mockEventsUpdate,
          delete: mockEventsDelete,
        },
      }),
    },
  };
});

import {
  getAuthenticatedClient,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from './google-calendar';

describe('Google Calendar Service', () => {
  // Get mocks from global
  const getMocks = () => ({
    mockSetCredentials: (global as any).mockSetCredentials,
    mockRefreshAccessToken: (global as any).mockRefreshAccessToken,
    mockEventsInsert: (global as any).mockEventsInsert,
    mockEventsUpdate: (global as any).mockEventsUpdate,
    mockEventsDelete: (global as any).mockEventsDelete,
  });

  beforeEach(async () => {
    await prisma.googleAuth.deleteMany();
    const mocks = getMocks();
    mocks.mockSetCredentials.mockClear();
    mocks.mockRefreshAccessToken.mockClear();
    mocks.mockEventsInsert.mockClear();
    mocks.mockEventsUpdate.mockClear();
    mocks.mockEventsDelete.mockClear();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getAuthenticatedClient', () => {
    it('returns authenticated client when valid GoogleAuth record exists', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      await prisma.googleAuth.create({
        data: {
          accessToken: 'valid-token',
          refreshToken: 'refresh-token',
          expiresAt: futureDate,
        },
      });

      const client = await getAuthenticatedClient();
      const { mockSetCredentials } = getMocks();

      expect(client).not.toBeNull();
      expect(mockSetCredentials).toHaveBeenCalledWith({
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
      });
    });

    it('returns null when no GoogleAuth record exists', async () => {
      const client = await getAuthenticatedClient();

      expect(client).toBeNull();
    });

    it('refreshes token when expired and updates database', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      await prisma.googleAuth.create({
        data: {
          accessToken: 'expired-token',
          refreshToken: 'refresh-token',
          expiresAt: pastDate,
        },
      });

      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + 1);

      const { mockRefreshAccessToken } = getMocks();
      mockRefreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: 'new-access-token',
          expiry_date: newExpiry.getTime(),
        },
      });

      const client = await getAuthenticatedClient();

      expect(client).not.toBeNull();
      expect(mockRefreshAccessToken).toHaveBeenCalled();

      // Verify database was updated
      const updatedAuth = await prisma.googleAuth.findFirst();
      expect(updatedAuth?.accessToken).toBe('new-access-token');
    });
  });

  describe('createCalendarEvent', () => {
    it('creates a timed event with dateTime format and Europe/London timezone', async () => {
      // Set up authenticated client
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      await prisma.googleAuth.create({
        data: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: futureDate,
        },
      });

      const { mockEventsInsert } = getMocks();
      mockEventsInsert.mockResolvedValue({
        data: { id: 'google-event-123' },
      });

      const deadline = {
        date: new Date('2026-03-15'),
        time: '14:30',
        label: 'Proposal Submission',
        context: 'Final deadline',
        rfpName: 'Test RFP',
      };

      const eventId = await createCalendarEvent(deadline);

      expect(eventId).toBe('google-event-123');
      expect(mockEventsInsert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: 'Proposal Submission - Test RFP',
          description: 'Final deadline',
          start: {
            dateTime: expect.stringContaining('2026-03-15T14:30:00'),
            timeZone: 'Europe/London',
          },
          end: {
            dateTime: expect.stringContaining('2026-03-15T15:30:00'),
            timeZone: 'Europe/London',
          },
          reminders: {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: 1440 }],
          },
        }),
      });
    });

    it('creates an all-day event with date format when time is null', async () => {
      // Set up authenticated client
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      await prisma.googleAuth.create({
        data: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: futureDate,
        },
      });

      const { mockEventsInsert } = getMocks();
      mockEventsInsert.mockResolvedValue({
        data: { id: 'google-event-456' },
      });

      const deadline = {
        date: new Date('2026-03-15'),
        time: null,
        label: 'All-day Deadline',
        context: null,
        rfpName: 'Test RFP',
      };

      const eventId = await createCalendarEvent(deadline);

      expect(eventId).toBe('google-event-456');
      expect(mockEventsInsert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: 'All-day Deadline - Test RFP',
          description: '',
          start: {
            date: '2026-03-15',
          },
          end: {
            date: '2026-03-15',
          },
          reminders: {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: 1440 }],
          },
        }),
      });
    });

    it('handles API errors gracefully', async () => {
      // Set up authenticated client
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      await prisma.googleAuth.create({
        data: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: futureDate,
        },
      });

      const { mockEventsInsert } = getMocks();
      mockEventsInsert.mockRejectedValue(new Error('Calendar API error'));

      const deadline = {
        date: new Date('2026-03-15'),
        time: '14:30',
        label: 'Test',
        context: null,
        rfpName: 'Test RFP',
      };

      await expect(createCalendarEvent(deadline)).rejects.toThrow(
        'Calendar API error'
      );
    });
  });

  describe('updateCalendarEvent', () => {
    it('updates an existing calendar event with new data', async () => {
      // Set up authenticated client
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      await prisma.googleAuth.create({
        data: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: futureDate,
        },
      });

      const { mockEventsUpdate } = getMocks();
      mockEventsUpdate.mockResolvedValue({
        data: { id: 'google-event-123' },
      });

      const deadline = {
        date: new Date('2026-03-20'),
        time: '16:00',
        label: 'Updated Deadline',
        context: 'Updated context',
        rfpName: 'Test RFP',
      };

      await updateCalendarEvent('google-event-123', deadline);

      expect(mockEventsUpdate).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'google-event-123',
        requestBody: expect.objectContaining({
          summary: 'Updated Deadline - Test RFP',
          description: 'Updated context',
          start: {
            dateTime: expect.stringContaining('2026-03-20T16:00:00'),
            timeZone: 'Europe/London',
          },
        }),
      });
    });
  });

  describe('deleteCalendarEvent', () => {
    it('deletes a calendar event by event ID', async () => {
      // Set up authenticated client
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      await prisma.googleAuth.create({
        data: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: futureDate,
        },
      });

      const { mockEventsDelete } = getMocks();
      mockEventsDelete.mockResolvedValue({});

      await deleteCalendarEvent('google-event-123');

      expect(mockEventsDelete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'google-event-123',
      });
    });

    it('handles deletion errors gracefully', async () => {
      // Set up authenticated client
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      await prisma.googleAuth.create({
        data: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: futureDate,
        },
      });

      const { mockEventsDelete } = getMocks();
      mockEventsDelete.mockRejectedValue(new Error('Event not found'));

      await expect(deleteCalendarEvent('invalid-id')).rejects.toThrow(
        'Event not found'
      );
    });
  });
});
