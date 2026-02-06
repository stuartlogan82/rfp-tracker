# PRD: Google Calendar Sync

## Introduction/Overview

Currently, the RFP Deadline Tracker exports deadlines as `.ics` files that users download and manually import into their calendar. This feature replaces that manual step with a direct Google Calendar integration. Users sign in to their Google account once, and from then on, clicking "Export" on any deadline (or "Export All") pushes events directly to their Google Calendar. When deadlines are updated or deleted in the tracker, the corresponding Google Calendar events are automatically updated or removed.

## Goals

1. Eliminate the manual download-and-import step for calendar exports.
2. Keep Google Calendar events in sync with the tracker — create, update, and delete events automatically.
3. Provide a seamless one-time OAuth setup with no repeated sign-in prompts.
4. Maintain the existing `.ics` download as a fallback for users who don't connect Google.

## User Stories

- **As a Sales Engineer**, I want to click "Export" on a deadline and have it appear in my Google Calendar immediately, so I don't have to download and import `.ics` files manually.
- **As a Sales Engineer**, I want to click "Export All" and have all my active incomplete deadlines pushed to Google Calendar in one action.
- **As a Sales Engineer**, I want my Google Calendar events to update automatically when I change a deadline's date, time, or label in the tracker, so my calendar is always accurate.
- **As a Sales Engineer**, I want Google Calendar events to be removed when I delete a deadline or mark it complete, so my calendar doesn't have stale entries.
- **As a Sales Engineer**, I want to connect my Google account once and have it remembered, so I don't have to sign in every time.
- **As a Sales Engineer**, I want the option to disconnect my Google account if I no longer want sync enabled.

## Functional Requirements

### Authentication & Connection

1. The system must provide a "Connect Google Calendar" button in the app settings or dashboard header.
2. Clicking "Connect" must initiate the Google OAuth 2.0 flow, requesting permission to manage calendar events (`https://www.googleapis.com/auth/calendar.events`).
3. After successful authorization, the system must store the OAuth refresh token locally (in the SQLite database) so the user stays connected across sessions.
4. The system must provide a "Disconnect Google Calendar" option that revokes the token and removes it from the database.
5. The system must handle token expiry gracefully — use the refresh token to obtain new access tokens automatically.

### Event Creation (Export)

6. When Google Calendar is connected and the user clicks "Export" on a single deadline, the system must create a Google Calendar event via the Google Calendar API (instead of downloading an `.ics` file).
7. When the user clicks "Export All", the system must create Google Calendar events for all active incomplete deadlines that don't already have a linked Google Calendar event.
8. Each created event must include: summary (deadline label + RFP name), date/time, description (context field if present), and a 24-hour reminder.
9. Timed deadlines must create timed events (1-hour duration). All-day deadlines (no time) must create all-day events.
10. After creating a Google Calendar event, the system must store the Google event ID in the database, linked to the deadline record, to enable future updates and deletes.
11. The system must show a success/error notification after each export action (e.g. "Added to Google Calendar" or "Failed to sync — check connection").

### Event Sync (Update & Delete)

12. When a deadline's date, time, label, or context is updated in the tracker, the system must automatically update the corresponding Google Calendar event (if one exists).
13. When a deadline is deleted from the tracker, the system must automatically delete the corresponding Google Calendar event (if one exists).
14. When a deadline is marked as completed, the system must delete the corresponding Google Calendar event (completed deadlines should not remain on the calendar).
15. Sync operations must be best-effort — if a Google API call fails (network error, token expired, etc.), the local change must still succeed. The system should log the sync failure and optionally notify the user.

### Fallback Behaviour

16. When Google Calendar is NOT connected, the "Export" and "Export All" buttons must continue to work as they do today — downloading `.ics` files.
17. The UI must clearly indicate whether Google Calendar is connected (e.g. a small icon or status indicator near the export buttons).

## Non-Goals (Out of Scope)

- **Multiple Google accounts** — only a single personal Google account is supported.
- **Choosing a specific sub-calendar** — events will be created on the user's primary/default calendar.
- **Two-way sync from Google Calendar back to the tracker** — edits made directly in Google Calendar will not be reflected in the tracker.
- **Support for other calendar providers** (Outlook, Apple Calendar, etc.) — only Google Calendar.
- **Recurring events** — each deadline is a standalone event.
- **Batch sync on app startup** — sync only happens when the user takes an action (export, edit, delete) or when deadlines change.

## Technical Considerations

- **Google API Client Library**: Use the `googleapis` npm package (official Google APIs Node.js client) for Calendar API calls.
- **OAuth Credentials**: Requires a Google Cloud project with the Calendar API enabled and OAuth 2.0 credentials (Client ID + Client Secret). These will be stored in `.env.local` as `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
- **Token Storage**: Add a new database model (e.g. `GoogleAuth`) to store the refresh token, access token, and expiry timestamp. Since this is a single-user app, there will be at most one row.
- **Database Schema Change**: Add a `googleEventId` (nullable string) column to the `Deadline` model to track which deadlines have been synced.
- **API Route Structure**:
  - `GET /api/auth/google` — initiates OAuth flow (redirects to Google)
  - `GET /api/auth/google/callback` — handles OAuth callback, stores tokens
  - `DELETE /api/auth/google` — disconnects (revokes token, deletes from DB)
  - `GET /api/auth/google/status` — returns connection status
  - Modify existing `POST/PUT/DELETE` deadline routes to trigger sync side-effects.
- **Rate Limits**: Google Calendar API has generous limits (1,000,000 queries/day) so rate limiting is not a concern for single-user usage.
- **Timezone**: All events should be created with the `Europe/London` timezone, matching the app's existing timezone convention.

## Design Considerations

- Add a "Google Calendar" connection status indicator in the dashboard header area (near the existing "Export All" button).
- When connected: show a green dot/checkmark and "Google Calendar connected" text. The "Export" buttons should change label to "Sync to Calendar" or show a Google Calendar icon.
- When not connected: show "Connect Google Calendar" link/button.
- Export actions should show a brief toast/notification on success or failure.
- The disconnect option can live in a small settings dropdown or next to the connection indicator.

## Success Metrics

1. Clicking "Export" on a deadline creates a corresponding event in Google Calendar within 2 seconds.
2. Updating a deadline in the tracker updates the Google Calendar event automatically.
3. Deleting a deadline or marking it complete removes the Google Calendar event.
4. The OAuth flow completes successfully and persists across browser sessions.
5. The `.ics` download fallback continues to work when Google is not connected.

## Resolved Questions

1. **"Export All" behaviour:** Skip deadlines that already have a `googleEventId` — only create events for un-synced deadlines. (Use "Sync All" for bulk updates.)
2. **"Sync All" button:** Yes — provide a "Sync All" action that updates all existing synced events to reflect current deadline data and creates events for any un-synced deadlines. Useful for recovery after failed syncs.
3. **Re-create on un-complete:** Yes — if a deadline is marked incomplete after previously being completed (and its Google event was deleted), the system must re-create the Google Calendar event.
