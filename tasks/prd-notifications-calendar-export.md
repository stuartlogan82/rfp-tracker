# PRD: In-App Notifications & Calendar Export

## 1. Introduction / Overview

The RFP Deadline Tracker dashboard (Tasks 1-6) already surfaces all upcoming deadlines with urgency color-coding in a sortable table. However, users can still miss imminent deadlines if they don't scan the table carefully, and there is no way to push deadlines into their calendar for native phone/desktop reminders.

This feature adds two capabilities:
1. **NotificationBanner** — a prominent, dismissable alert at the top of the dashboard whenever any deadline is within 3 days (or overdue), giving the user an at-a-glance heads-up.
2. **Calendar Export (.ics)** — the ability to export individual deadlines or all active deadlines as `.ics` files that can be imported into any calendar application (Apple Calendar, Outlook, Google Calendar).

## 2. Goals

- **Increase deadline visibility:** Surface a clear, unmissable warning when deadlines are imminent so the user doesn't have to scan the full table.
- **Enable native calendar reminders:** Let the user export deadlines to their calendar so they receive native phone/desktop notifications even when the dashboard isn't open.
- **Zero missed deadlines:** Close the last gap between "data is in the system" and "user is actually reminded."
- **Non-breaking addition:** All new functionality is purely additive — no changes to existing database schema, API contracts, or component interfaces.

## 3. User Stories

1. **As an SE**, I want to see a prominent warning banner at the top of the dashboard when any deadline is within 3 days so I can take immediate action without scanning the full table.
2. **As an SE**, I want to expand the warning banner to see which specific deadlines are urgent so I can prioritise without scrolling.
3. **As an SE**, I want to dismiss the banner for the current session so it doesn't distract me after I've acknowledged the warnings.
4. **As an SE**, I want to export a single deadline to my calendar so I get a native reminder for that specific event.
5. **As an SE**, I want to export all active deadlines at once so I can bulk-import them into my calendar without clicking one by one.
6. **As an SE**, I want exported calendar events to include a 24-hour reminder alarm so I get notified the day before a deadline.

## 4. Functional Requirements

### NotificationBanner Component

1. The system must display a notification banner at the top of the dashboard (above SummaryCards, below the header) whenever one or more incomplete deadlines are within 3 days or overdue.
2. The banner must show a count of urgent deadlines (e.g., "3 deadlines are due within 3 days").
3. The banner must be expandable — clicking a toggle reveals a list of the specific urgent deadline labels and their dates.
4. The banner must be dismissable via a close button. Dismissal is session-only (the banner reappears on page refresh).
5. The banner must not appear when there are no urgent or overdue incomplete deadlines.
6. The banner must use the existing `getUrgencyLevel()` function from `src/lib/urgency.ts` to determine which deadlines qualify (levels `critical` or `overdue`).
7. The banner must visually match the existing urgency color scheme — red background tones (`bg-red-50`, `border-red-200`, `text-red-800`) consistent with the critical/overdue palette.

### ICS Generator Library

8. The system must provide a `src/lib/ics-generator.ts` module that converts deadline data into `.ics` calendar file content.
9. The generator must use the already-installed `ics` npm package (v3.8.1).
10. The generator must export a `generateIcs(deadlines)` function that accepts an array of deadlines (each with label, date, time, context, and parent RFP name) and returns the `.ics` file content as a string.
11. For deadlines **with** a specific time: the generator must create a 1-hour timed calendar event starting at that time.
12. For deadlines **without** a specific time: the generator must create an all-day calendar event on that date.
13. Each calendar event title must include both the deadline label and the RFP name (e.g., "Proposal Submission Deadline - HMRC Cloud Migration RFP").
14. Each calendar event must include the deadline's context field as the event description (if context exists).
15. Each calendar event must include a VALARM (display alarm) trigger set to 24 hours before the event start.
16. The generator must handle both single-event and multi-event generation (using `createEvent` and `createEvents` from the `ics` package respectively).
17. All dates must be output in UTC (using `startInputType: 'utc'`) — the user's calendar application will convert to their local timezone (Europe/London).

### Calendar Export API Route

18. The system must provide a `GET /api/export` route that returns `.ics` file downloads.
19. The route must support a `deadlineId` query parameter — when provided, export a single deadline as a `.ics` file.
20. The route must support a `bulk=true` query parameter (or no parameters) — when specified, export all incomplete deadlines from active RFPs as a single `.ics` file.
21. The response must set `Content-Type: text/calendar; charset=utf-8` header.
22. The response must set `Content-Disposition: attachment; filename="<name>.ics"` header to trigger a browser download.
23. For single exports, the filename should be based on the deadline label (sanitised for filesystem safety, e.g., `proposal-submission-deadline.ics`).
24. For bulk exports, the filename should include the current date (e.g., `deadlines-2025-02-06.ics`).
25. The route must return 404 if a requested `deadlineId` does not exist.
26. The route must return 500 with a JSON error message if `.ics` generation fails.

### UI Export Buttons

27. Each row in the `DeadlineTable` component must include an "Export" button (or calendar icon button) that triggers a download of that deadline's `.ics` file.
28. The dashboard header/toolbar area must include an "Export All" button that triggers a download of all active, incomplete deadlines as a single `.ics` file.
29. Export buttons must use a simple anchor (`<a href="/api/export?..." download>`) or programmatic fetch+blob approach to trigger the download.
30. The "Export All" button should be disabled (or hidden) when there are no active incomplete deadlines to export.

## 5. Non-Goals (Out of Scope)

- **Push notifications / service workers:** No browser push notifications. Only in-app banner and calendar export.
- **Calendar sync (CalDAV/Google Calendar API):** No live calendar integration. Export is file-based (.ics download).
- **Persistent dismiss state:** Banner dismissal does not persist across sessions (no localStorage). This is intentional to ensure the user sees warnings each time they open the dashboard.
- **Custom alarm timing:** The 24-hour alarm is fixed for v1. No user-configurable reminder timing.
- **Recurring events:** Deadlines are single occurrences. No iCal RRULE support needed.
- **Database schema changes:** No new models or fields required. All functionality uses existing Deadline and Rfp data.
- **Email notifications:** Out of scope per the original PRD.

## 6. Design Considerations

### NotificationBanner Placement & Style
- Position: Full-width banner between the dashboard header row (title + filters) and the SummaryCards row.
- Colour: Red-tinted background (`bg-red-50`) with red border (`border-red-200`) and dark red text (`text-red-800`), matching the existing urgency palette.
- Icon: A warning/alert triangle icon (from lucide-react, which is already available via shadcn/ui).
- Layout: Icon + count text on the left, expand toggle in the middle, dismiss (X) button on the right.
- Expanded state: Below the count line, show a compact list of urgent deadline labels with dates, indented under the banner.
- Animation: Optional subtle expand/collapse transition (CSS `max-height` or similar). Not critical.

### Export Button Placement
- **Per-row:** Small calendar icon button in the DeadlineTable, in a new "Actions" column or appended to an existing column. Should be unobtrusive.
- **Bulk:** "Export All" button in the dashboard header area, near the existing "Show All" toggle. Should use the same Button component style (outline or secondary variant).

### File Naming Convention
- Single: `<label-slugified>.ics` (e.g., `proposal-submission-deadline.ics`)
- Bulk: `rfp-deadlines-<YYYY-MM-DD>.ics`

## 7. Technical Considerations

### `ics` Package API
- The `ics` package is already installed (v3.8.1). It exports `createEvent(attrs)` and `createEvents(attrs[])`.
- Both return `{ error?: Error, value?: string }` when called without a callback.
- `DateArray` format: `[year, month, day]` for all-day, `[year, month, day, hour, minute]` for timed events. **Important:** Month is 1-indexed (January = 1), unlike JavaScript's `Date.getMonth()` which is 0-indexed.
- For all-day events, the `end` date should be set to the **next day** (iCal spec: `DTEND` is exclusive).
- Use `startInputType: 'utc'` since Prisma stores dates as UTC ISO strings.

### Timezone Handling
- Deadline dates are stored as `DateTime` in Prisma (UTC ISO 8601).
- The `time` field is a separate nullable string (`"HH:MM"` or null).
- For .ics generation: combine `date` and `time` into a UTC DateArray. Since the original RFP dates are in UK time and stored via Prisma, the stored UTC value is correct.
- Calendar apps will display in the user's local timezone. For a London-based single user, this is correct behaviour.

### Response Headers for File Download
- `Content-Type: text/calendar; charset=utf-8` (RFC 5545 MIME type)
- `Content-Disposition: attachment; filename="deadlines.ics"` (forces download)
- Use `new Response(icsString, { headers })` — NOT `NextResponse.json()`.

### Integration Points
- `NotificationBanner` receives `DeadlineWithRfp[]` from Dashboard (same data already fetched).
- Export API route queries Prisma directly (same patterns as existing `/api/deadlines` routes).
- `ics-generator.ts` is a pure utility module — no external service calls, easy to test with real inputs.

### Existing Code to Modify
- **`src/components/Dashboard.tsx`:** Add `<NotificationBanner>` in the render tree and add "Export All" button to the header area.
- **`src/components/DeadlineTable.tsx`:** Add an "Export" action button/link to each deadline row.
- No changes to database, Prisma schema, or existing API routes.

### TDD Approach
Following the project's strict TDD discipline:
1. **`ics-generator.test.ts`** — Unit tests for the generator with real inputs/outputs (no mocking per CLAUDE.md: "Never mock pure utility functions").
2. **`export/route.test.ts`** — Integration tests for the API route (real database, mock nothing except what's needed).
3. **`NotificationBanner.test.ts`** — Component tests with React Testing Library (test rendering, dismiss behaviour, expand/collapse, edge cases).
4. **`DeadlineTable` export button tests** — Verify the export link/button renders with correct href.

## 8. Success Metrics

- **Banner accuracy:** The NotificationBanner appears if and only if there are incomplete deadlines within 3 days or overdue. Zero false positives, zero false negatives.
- **Export validity:** Generated `.ics` files import successfully into Apple Calendar, Outlook, and Google Calendar with correct dates, times, labels, and 24-hour reminders.
- **No regressions:** All existing tests continue to pass. No changes to existing component interfaces or API contracts.
- **User workflow:** Exporting a single deadline takes one click. Bulk export takes one click.

## 9. Open Questions

_None at this time. All clarifications have been resolved._
