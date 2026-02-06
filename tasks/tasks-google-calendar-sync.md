# Tasks: Google Calendar Sync

## Relevant Files

- `prisma/schema.prisma` - **Existing file** — add `GoogleAuth` model and `googleEventId` field to `Deadline` model.
- `src/lib/db.ts` - **Existing file (read-only)** — Prisma client singleton, used by all new and modified routes.
- `src/lib/google-calendar.ts` - New service module wrapping the Google Calendar API (create, update, delete events, token management).
- `src/lib/google-calendar.test.ts` - Unit tests for the Google Calendar service (mock `googleapis`).
- `src/app/api/auth/google/route.ts` - New API route — initiates OAuth flow (GET) and disconnects (DELETE).
- `src/app/api/auth/google/route.test.ts` - Integration tests for OAuth initiation and disconnect.
- `src/app/api/auth/google/callback/route.ts` - New API route — handles OAuth callback, stores tokens.
- `src/app/api/auth/google/callback/route.test.ts` - Integration tests for OAuth callback.
- `src/app/api/auth/google/status/route.ts` - New API route — returns Google connection status.
- `src/app/api/auth/google/status/route.test.ts` - Integration tests for status endpoint.
- `src/app/api/deadlines/route.ts` - **Existing file** — modify POST to sync new deadlines to Google Calendar.
- `src/app/api/deadlines/route.test.ts` - **Existing file** — add tests for Google Calendar sync on create.
- `src/app/api/deadlines/[id]/route.ts` - **Existing file** — modify PUT and DELETE to sync changes to Google Calendar.
- `src/app/api/deadlines/[id]/route.test.ts` - **Existing file** — add tests for Google Calendar sync on update/delete.
- `src/app/api/export/route.ts` - **Existing file** — modify to push to Google Calendar when connected (instead of `.ics` download).
- `src/app/api/export/route.test.ts` - **Existing file** — add tests for Google Calendar export path.
- `src/app/api/sync/route.ts` - New API route — "Sync All" endpoint to bulk update/create Google Calendar events.
- `src/app/api/sync/route.test.ts` - Integration tests for Sync All.
- `src/components/GoogleCalendarStatus.tsx` - New component — connection status indicator with connect/disconnect actions.
- `src/components/GoogleCalendarStatus.test.tsx` - Component tests for Google Calendar status indicator.
- `src/components/Toast.tsx` - New component — lightweight toast notification for success/error feedback.
- `src/components/Toast.test.tsx` - Component tests for Toast.
- `src/components/Dashboard.tsx` - **Existing file** — integrate GoogleCalendarStatus, "Sync All" button, and Toast notifications.
- `src/components/Dashboard.test.tsx` - **Existing file** — add tests for new integrations.
- `src/components/DeadlineTable.tsx` - **Existing file** — modify export button behaviour when Google is connected.
- `src/components/DeadlineTable.test.tsx` - **Existing file** — add tests for Google Calendar export button variant.
- `src/types/index.ts` - **Existing file** — add `GoogleAuth` type if needed.

### Notes

- Unit tests should be placed alongside the code files they are testing (e.g., `google-calendar.ts` and `google-calendar.test.ts` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The `googleapis` npm package is required — install it in Task 1.0.
- Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) must be set in `.env.local`.
- API route tests require the `@jest-environment node` docblock at the top of the file.
- The Google Calendar service (`src/lib/google-calendar.ts`) is an external service boundary — **always mock** in tests per CLAUDE.md.
- Existing tests must continue to pass after all changes (`npx jest`).

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Branch Strategy

Each major task gets its own feature branch off `main`. After completing a task, all tests pass, and you have manually verified the work, commit on that branch and **wait for user approval** before merging to `main` and starting the next task.

```
main
 ├─ feature/google-cal-schema        (Task 1.0)
 ├─ feature/google-oauth             (Task 2.0 — branches from main after 1.0 merged)
 ├─ feature/google-cal-service       (Task 3.0 — branches from main after 2.0 merged)
 ├─ feature/google-cal-auto-sync     (Task 4.0 — branches from main after 3.0 merged)
 ├─ feature/google-cal-ui            (Task 5.0 — branches from main after 4.0 merged)
 ├─ feature/google-cal-sync-all      (Task 6.0 — branches from main after 5.0 merged)
 └─ feature/google-cal-polish        (Task 7.0 — branches from main after 6.0 merged)
```

## Tasks

- [ ] 1.0 Database schema changes & dependency installation
  - [x] 1.1 Create and checkout branch: `git checkout -b feature/google-cal-schema`
  - [x] 1.2 Install the `googleapis` npm package: `npm install googleapis`
  - [x] 1.3 Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` placeholder entries to `.env.local` (and document them in CLAUDE.md tech stack section).
  - [x] 1.4 Add a `GoogleAuth` model to `prisma/schema.prisma` with fields: `id` (Int, autoincrement), `accessToken` (String), `refreshToken` (String), `expiresAt` (DateTime), `createdAt` (DateTime, default now), `updatedAt` (DateTime, updatedAt). Since this is a single-user app, there will be at most one row.
  - [x] 1.5 Add a `googleEventId` field (String, nullable) to the existing `Deadline` model in `prisma/schema.prisma`. This tracks which deadlines have been synced to Google Calendar.
  - [x] 1.6 Run `npx prisma migrate dev --name add-google-calendar` to create and apply the migration.
  - [x] 1.7 Run `npx prisma generate` to regenerate the Prisma client.
  - [x] 1.8 **Write test:** In `src/lib/db.test.ts`, add a test that creates a `GoogleAuth` record and verifies it can be read back. Add a test that creates a `Deadline` with a `googleEventId` and verifies it persists. Run to confirm GREEN.
  - [x] 1.9 **Full regression:** Run `npx jest` to confirm all existing tests still pass with the schema changes.
  - [ ] 1.10 **Commit:** Stage and commit all changes with a descriptive message.
  - [ ] 1.11 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [ ] 2.0 Google OAuth authentication flow
  - [ ] 2.1 Merge `feature/google-cal-schema` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/google-oauth`
  - [ ] 2.2 **Write failing test:** Create `src/app/api/auth/google/route.test.ts` with `@jest-environment node` docblock. Mock the `googleapis` module. Write a test that calls `GET /api/auth/google` and asserts the response is a redirect (302) to a URL containing `accounts.google.com`. Run to confirm RED.
  - [ ] 2.3 **Write failing test:** Add a test that calls `DELETE /api/auth/google` when a `GoogleAuth` record exists — assert it returns 200 and the record is deleted from the database. Run to confirm RED.
  - [ ] 2.4 **Write failing test:** Add a test that calls `DELETE /api/auth/google` when no `GoogleAuth` record exists — assert it returns 404. Run to confirm RED.
  - [ ] 2.5 **Implement:** Create `src/app/api/auth/google/route.ts` with GET and DELETE handlers. GET constructs a Google OAuth2 client using the env vars, generates an auth URL with `calendar.events` scope and `access_type: 'offline'`, and returns a redirect. DELETE finds the `GoogleAuth` record, revokes the token via the Google API (best-effort), and deletes the record from the database.
  - [ ] 2.6 **Verify GREEN:** Run `npx jest src/app/api/auth/google/route.test.ts` — all tests must pass.
  - [ ] 2.7 **Write failing test:** Create `src/app/api/auth/google/callback/route.test.ts` with `@jest-environment node` docblock. Mock the `googleapis` module. Write a test that calls `GET /api/auth/google/callback?code=mock_code` and asserts: it exchanges the code for tokens, stores a `GoogleAuth` record in the database, and redirects to `/` (the dashboard). Run to confirm RED.
  - [ ] 2.8 **Write failing test:** Add a test for the callback when the `code` parameter is missing — assert it returns 400. Run to confirm RED.
  - [ ] 2.9 **Write failing test:** Add a test for the callback when a `GoogleAuth` record already exists — assert it updates the existing record rather than creating a duplicate. Run to confirm RED.
  - [ ] 2.10 **Implement:** Create `src/app/api/auth/google/callback/route.ts` with a GET handler. Extract `code` from search params (return 400 if missing). Use the Google OAuth2 client to exchange the code for tokens. Upsert the `GoogleAuth` record (create if none exists, update if one does). Redirect to `/`.
  - [ ] 2.11 **Verify GREEN:** Run `npx jest src/app/api/auth/google/callback/route.test.ts` — all tests must pass.
  - [ ] 2.12 **Write failing test:** Create `src/app/api/auth/google/status/route.test.ts` with `@jest-environment node` docblock. Write a test that returns `{ connected: true }` when a `GoogleAuth` record exists, and `{ connected: false }` when it doesn't. Run to confirm RED.
  - [ ] 2.13 **Implement:** Create `src/app/api/auth/google/status/route.ts` with a GET handler. Query for a `GoogleAuth` record — return `{ connected: true }` if found, `{ connected: false }` otherwise.
  - [ ] 2.14 **Verify GREEN:** Run `npx jest src/app/api/auth/google/status/route.test.ts` — all tests must pass.
  - [ ] 2.15 **Full regression:** Run `npx jest` to confirm no regressions.
  - [ ] 2.16 **Commit:** Stage and commit all changes with a descriptive message.
  - [ ] 2.17 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [ ] 3.0 Google Calendar API service layer
  - [ ] 3.1 Merge `feature/google-oauth` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/google-cal-service`
  - [ ] 3.2 **Write failing test:** Create `src/lib/google-calendar.test.ts`. Mock the `googleapis` module. Write a test for `getAuthenticatedClient()` that: when a valid `GoogleAuth` record exists in the database, returns an authenticated OAuth2 client. When no record exists, returns `null`. Run to confirm RED.
  - [ ] 3.3 **Write failing test:** Add a test for `getAuthenticatedClient()` that: when the stored `expiresAt` is in the past, uses the refresh token to obtain a new access token and updates the database record. Run to confirm RED.
  - [ ] 3.4 **Write failing test:** Add a test for `createCalendarEvent(deadline)` that: calls the Google Calendar API `events.insert` with the correct parameters (summary, start, end, description, reminders) and returns the created event's `id`. Run to confirm RED.
  - [ ] 3.5 **Write failing test:** Add a test for `createCalendarEvent()` with a timed deadline (has `time` field) — verify the event start/end use `dateTime` format with `Europe/London` timezone. Add a test with an all-day deadline (time is null) — verify the event start/end use `date` format. Run to confirm RED.
  - [ ] 3.6 **Write failing test:** Add a test for `updateCalendarEvent(googleEventId, deadline)` that calls `events.update` with the correct event ID and updated data, and returns successfully. Run to confirm RED.
  - [ ] 3.7 **Write failing test:** Add a test for `deleteCalendarEvent(googleEventId)` that calls `events.delete` with the correct event ID and returns successfully. Run to confirm RED.
  - [ ] 3.8 **Write failing test:** Add a test that verifies `createCalendarEvent` gracefully handles API errors (throws or returns null with a meaningful message). Run to confirm RED.
  - [ ] 3.9 **Implement:** Create `src/lib/google-calendar.ts`. Export the following functions:
    - `getAuthenticatedClient()`: Fetches the `GoogleAuth` record from the database. If none exists, returns `null`. If the token is expired (`expiresAt < now`), uses the refresh token to get a new access token, updates the database, and returns the client. Otherwise returns the client with the current access token.
    - `createCalendarEvent(deadline: { date: Date | string, time: string | null, label: string, context: string | null, rfpName: string })`: Uses the authenticated client to call `calendar.events.insert` on the primary calendar. Formats timed events with `dateTime` and timezone `Europe/London`, all-day events with `date` only. Includes a 24-hour popup reminder. Returns the event ID string.
    - `updateCalendarEvent(googleEventId: string, deadline: same shape)`: Calls `calendar.events.update` with the existing event ID.
    - `deleteCalendarEvent(googleEventId: string)`: Calls `calendar.events.delete`.
    - All functions should handle errors gracefully (try/catch, log errors, throw or return null).
  - [ ] 3.10 **Verify GREEN:** Run `npx jest src/lib/google-calendar.test.ts` — all tests must pass.
  - [ ] 3.11 **Full regression:** Run `npx jest` to confirm no regressions.
  - [ ] 3.12 **Commit:** Stage and commit all changes with a descriptive message.
  - [ ] 3.13 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [ ] 4.0 Auto-sync on deadline create, update, delete, and complete
  - [ ] 4.1 Merge `feature/google-cal-service` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/google-cal-auto-sync`
  - [ ] 4.2 **Write failing test:** In `src/app/api/deadlines/route.test.ts`, mock `src/lib/google-calendar`. Add a test that: when Google is connected (mock `getAuthenticatedClient` returns a client), creating a deadline via POST also calls `createCalendarEvent` and stores the returned `googleEventId` on the deadline record. Run to confirm RED.
  - [ ] 4.3 **Write failing test:** Add a test that: when Google is NOT connected (mock `getAuthenticatedClient` returns null), creating a deadline via POST succeeds without calling `createCalendarEvent` and `googleEventId` is null. Run to confirm RED.
  - [ ] 4.4 **Modify:** Update `src/app/api/deadlines/route.ts` POST handler. After creating the deadline, check if Google is connected via `getAuthenticatedClient()`. If connected, call `createCalendarEvent()`, then update the deadline record with the returned `googleEventId`. Wrap in try/catch — sync failure must not fail the main operation.
  - [ ] 4.5 **Verify GREEN:** Run `npx jest src/app/api/deadlines/route.test.ts` — all tests must pass.
  - [ ] 4.6 **Write failing test:** In `src/app/api/deadlines/[id]/route.test.ts`, mock `src/lib/google-calendar`. Add a test that: when a deadline with a `googleEventId` is updated via PUT (date/time/label change), `updateCalendarEvent` is called with the event ID. Run to confirm RED.
  - [ ] 4.7 **Write failing test:** Add a test that: when a deadline is marked `completed: true` via PUT and it has a `googleEventId`, `deleteCalendarEvent` is called and `googleEventId` is set to null. Run to confirm RED.
  - [ ] 4.8 **Write failing test:** Add a test that: when a deadline is marked `completed: false` via PUT (un-completed) and Google is connected, `createCalendarEvent` is called and the new `googleEventId` is stored. Run to confirm RED.
  - [ ] 4.9 **Write failing test:** Add a test that: when a deadline with a `googleEventId` is deleted via DELETE, `deleteCalendarEvent` is called. Run to confirm RED.
  - [ ] 4.10 **Write failing test:** Add a test that: when Google sync fails during PUT (mock throws error), the deadline update still succeeds (sync is best-effort). Run to confirm RED.
  - [ ] 4.11 **Modify:** Update `src/app/api/deadlines/[id]/route.ts`:
    - **PUT handler:** After updating the deadline, check if Google is connected. If the deadline was marked `completed: true` and has a `googleEventId`, call `deleteCalendarEvent` and set `googleEventId` to null. If the deadline was marked `completed: false` (un-completed) and Google is connected, call `createCalendarEvent` and store the new `googleEventId`. Otherwise, if the deadline has a `googleEventId` and sync-relevant fields changed (date, time, label, context), call `updateCalendarEvent`. Wrap all sync in try/catch.
    - **DELETE handler:** Before deleting the deadline, if it has a `googleEventId`, call `deleteCalendarEvent` (best-effort). Then proceed with the delete.
  - [ ] 4.12 **Verify GREEN:** Run `npx jest src/app/api/deadlines/[id]/route.test.ts` — all tests must pass.
  - [ ] 4.13 **Full regression:** Run `npx jest` to confirm no regressions.
  - [ ] 4.14 **Commit:** Stage and commit all changes with a descriptive message.
  - [ ] 4.15 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [ ] 5.0 UI integration (connection status, export button changes, toast notifications)
  - [ ] 5.1 Merge `feature/google-cal-auto-sync` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/google-cal-ui`
  - [ ] 5.2 **Write failing test:** Create `src/components/Toast.test.tsx`. Write a test that renders `<Toast message="Success" type="success" />` and verifies the message text is visible. Add a test for `type="error"` with different styling. Add a test that the toast auto-dismisses after a timeout (use `jest.useFakeTimers`). Run to confirm RED.
  - [ ] 5.3 **Implement:** Create `src/components/Toast.tsx` as a `'use client'` component. Props: `{ message: string, type: 'success' | 'error', onDismiss: () => void }`. Auto-dismiss after 4 seconds via `useEffect` + `setTimeout`. Style with green for success, red for error. Position fixed at bottom-right.
  - [ ] 5.4 **Verify GREEN:** Run `npx jest src/components/Toast.test.tsx` — all tests must pass.
  - [ ] 5.5 **Write failing test:** Create `src/components/GoogleCalendarStatus.test.tsx`. Write a test that: when `connected={false}`, renders a "Connect Google Calendar" link. When `connected={true}`, renders "Google Calendar connected" text and a "Disconnect" button. Run to confirm RED.
  - [ ] 5.6 **Write failing test:** Add a test that clicking "Disconnect" calls the `onDisconnect` callback prop. Run to confirm RED.
  - [ ] 5.7 **Implement:** Create `src/components/GoogleCalendarStatus.tsx` as a `'use client'` component. Props: `{ connected: boolean, onDisconnect: () => void }`. When not connected: render an `<a>` linking to `/api/auth/google` with text "Connect Google Calendar" and a Google icon. When connected: render a green indicator, "Google Calendar connected" text, and a "Disconnect" button.
  - [ ] 5.8 **Verify GREEN:** Run `npx jest src/components/GoogleCalendarStatus.test.tsx` — all tests must pass.
  - [ ] 5.9 **Write failing test:** In `src/components/Dashboard.test.tsx`, add a test that verifies the `GoogleCalendarStatus` component is rendered in the dashboard. Mock the `/api/auth/google/status` fetch to return `{ connected: true }`. Run to confirm RED.
  - [ ] 5.10 **Write failing test:** In `src/components/DeadlineTable.test.tsx`, add a test that: when `googleConnected={true}`, the export button text changes to "Sync" (or shows a Google icon), and the button triggers a fetch POST to `/api/export` instead of being a download link. Run to confirm RED.
  - [ ] 5.11 **Modify Dashboard:** Add state for `googleConnected` (default false). On mount, fetch `/api/auth/google/status` and update state. Render `GoogleCalendarStatus` in the header area. Add toast state management — pass a `showToast` callback down or use a simple state pattern. When Google is connected, the "Export All" button should POST to `/api/export` instead of being a download link. Handle disconnect by calling `DELETE /api/auth/google`, updating state, and showing a toast.
  - [ ] 5.12 **Modify DeadlineTable:** Add a `googleConnected` prop (boolean). When connected, the per-row export button should trigger a fetch to `/api/export?deadlineId=<id>` (POST) and show feedback via a callback prop, instead of being a download `<a>` tag. When not connected, keep the existing `.ics` download link behaviour.
  - [ ] 5.13 **Modify Export API:** Update `src/app/api/export/route.ts` to support both modes. Add a POST handler: when Google is connected, use `createCalendarEvent` for single deadline or loop for bulk (skipping already-synced deadlines per PRD). Update each deadline's `googleEventId` in the database. Return JSON `{ synced: count }`. Keep the existing GET handler for `.ics` download fallback.
  - [ ] 5.14 **Verify GREEN:** Run `npx jest src/components/Dashboard.test.tsx` and `npx jest src/components/DeadlineTable.test.tsx` — all tests must pass.
  - [ ] 5.15 **Full regression:** Run `npx jest` to confirm no regressions.
  - [ ] 5.16 **Commit:** Stage and commit all changes with a descriptive message.
  - [ ] 5.17 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [ ] 6.0 Sync All functionality
  - [ ] 6.1 Merge `feature/google-cal-ui` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/google-cal-sync-all`
  - [ ] 6.2 **Write failing test:** Create `src/app/api/sync/route.test.ts` with `@jest-environment node` docblock. Mock `src/lib/google-calendar`. Write a test that: when Google is connected, calling `POST /api/sync` creates events for un-synced deadlines (those without a `googleEventId`) and updates events for already-synced deadlines. Assert the response includes `{ created: N, updated: M }`. Run to confirm RED.
  - [ ] 6.3 **Write failing test:** Add a test that: when Google is not connected, `POST /api/sync` returns 400 with an error message. Run to confirm RED.
  - [ ] 6.4 **Write failing test:** Add a test that: completed deadlines are skipped (not synced). Only incomplete deadlines from Active RFPs are processed. Run to confirm RED.
  - [ ] 6.5 **Write failing test:** Add a test that: if an individual sync call fails, the route continues processing remaining deadlines (best-effort) and the response includes the failure count. Run to confirm RED.
  - [ ] 6.6 **Implement:** Create `src/app/api/sync/route.ts` with a POST handler. Check Google connection — return 400 if not connected. Fetch all incomplete deadlines from Active RFPs (same query as bulk export). For each deadline: if `googleEventId` is null, call `createCalendarEvent` and store the event ID; if `googleEventId` exists, call `updateCalendarEvent`. Track created/updated/failed counts. Return `{ created, updated, failed }`.
  - [ ] 6.7 **Verify GREEN:** Run `npx jest src/app/api/sync/route.test.ts` — all tests must pass.
  - [ ] 6.8 **Write failing test:** In `src/components/Dashboard.test.tsx`, add a test that: when Google is connected, a "Sync All" button is rendered. Clicking it calls `POST /api/sync` and shows a toast with the result. Run to confirm RED.
  - [ ] 6.9 **Modify Dashboard:** Add a "Sync All" button (visible only when Google is connected) next to "Export All". On click, POST to `/api/sync`, show a toast with the result ("Synced 5 deadlines to Google Calendar" or error).
  - [ ] 6.10 **Verify GREEN:** Run `npx jest src/components/Dashboard.test.tsx` — all tests must pass.
  - [ ] 6.11 **Full regression:** Run `npx jest` to confirm no regressions.
  - [ ] 6.12 **Commit:** Stage and commit all changes with a descriptive message.
  - [ ] 6.13 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [ ] 7.0 Integration verification & final polish
  - [ ] 7.1 Merge `feature/google-cal-sync-all` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/google-cal-polish`
  - [ ] 7.2 Run the full test suite (`npx jest`) and verify all tests pass with zero failures.
  - [ ] 7.3 Run `npm run build` to verify the production build succeeds with no TypeScript or compilation errors.
  - [ ] 7.4 Run `npm run lint` to verify no new linting errors were introduced.
  - [ ] 7.5 Manually verify: Navigate to the dashboard, click "Connect Google Calendar", complete the OAuth flow, and confirm the status indicator shows "connected".
  - [ ] 7.6 Manually verify: Click "Export" on a single deadline row and confirm the event appears in Google Calendar.
  - [ ] 7.7 Manually verify: Edit a synced deadline's date/label and confirm the Google Calendar event updates.
  - [ ] 7.8 Manually verify: Mark a synced deadline as complete and confirm the Google Calendar event is deleted.
  - [ ] 7.9 Manually verify: Un-complete the deadline and confirm the Google Calendar event is re-created.
  - [ ] 7.10 Manually verify: Delete a synced deadline and confirm the Google Calendar event is removed.
  - [ ] 7.11 Manually verify: Click "Sync All" and confirm all un-synced deadlines are pushed to Google Calendar.
  - [ ] 7.12 Manually verify: Click "Disconnect Google Calendar" and confirm: status shows disconnected, export buttons revert to `.ics` download behaviour.
  - [ ] 7.13 Manually verify: When disconnected, "Export" still downloads `.ics` files correctly.
  - [ ] 7.14 Update the parent task list `tasks/tasks-rfp-tracker.md` — add and check off the Google Calendar Sync task.
  - [ ] 7.15 **Commit** any polish changes with a descriptive message.
  - [ ] 7.16 **CHECKPOINT — Wait for user to test and approve before merging to main.**
