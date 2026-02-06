# Tasks: In-App Notifications & Calendar Export

## Relevant Files

- `src/lib/ics-generator.ts` - Pure utility module that converts deadline data into `.ics` calendar file content using the `ics` npm package.
- `src/lib/ics-generator.test.ts` - Unit tests for the ICS generator (no mocking — test with real inputs/outputs per CLAUDE.md).
- `src/app/api/export/route.ts` - GET API route that generates and returns `.ics` file downloads (single deadline or bulk export).
- `src/app/api/export/route.test.ts` - Integration tests for the export API route (real database, `@jest-environment node`).
- `src/components/NotificationBanner.tsx` - Dismissable alert banner shown when deadlines are within 3 days or overdue.
- `src/components/NotificationBanner.test.tsx` - Component tests using React Testing Library.
- `src/components/DeadlineTable.tsx` - **Existing file** — modify to add per-row "Export" button/link.
- `src/components/DeadlineTable.test.tsx` - **Existing file** — add tests for the new export button.
- `src/components/Dashboard.tsx` - **Existing file** — modify to integrate NotificationBanner and "Export All" button.
- `src/components/Dashboard.test.tsx` - **Existing file** — add tests for NotificationBanner integration and "Export All" button.
- `src/lib/urgency.ts` - **Existing file (read-only)** — NotificationBanner reuses `getUrgencyLevel()` from this module.
- `src/types/index.ts` - **Existing file (read-only)** — `DeadlineWithRfp` type used by NotificationBanner and ICS generator.

### Notes

- Unit tests should be placed alongside the code files they are testing (e.g., `ics-generator.ts` and `ics-generator.test.ts` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The `ics` npm package (v3.8.1) is already installed — no new dependencies needed.
- All dates must be handled in UK timezone (Europe/London, GMT/BST).
- The ICS generator is a **pure utility** — per CLAUDE.md, never mock pure utility functions. Test with real inputs/outputs.
- API route tests require the `@jest-environment node` docblock at the top of the file.
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
 ├─ feature/ics-generator          (Task 1.0)
 ├─ feature/export-api             (Task 2.0 — branches from main after 1.0 merged)
 ├─ feature/notification-banner    (Task 3.0 — branches from main after 2.0 merged)
 ├─ feature/export-buttons         (Task 4.0 — branches from main after 3.0 merged)
 └─ feature/final-polish           (Task 5.0 — branches from main after 4.0 merged)
```

## Tasks

- [x] 1.0 Build ICS generator utility (`src/lib/ics-generator.ts`)
  - [x] 1.1 Create and checkout branch: `git checkout -b feature/ics-generator`
  - [x] 1.2 **Write failing test:** Create `src/lib/ics-generator.test.ts`. Write a test that imports `generateIcsForDeadline` and verifies it returns a string containing `BEGIN:VCALENDAR` and `END:VCALENDAR` for a single deadline with a specific time (e.g., date `2026-03-15`, time `"14:00"`, label `"Proposal Due"`, rfpName `"NHS RFP"`). Run `npx jest src/lib/ics-generator.test.ts` to confirm it fails (RED).
  - [x] 1.3 **Write failing test:** Add a test that verifies the returned `.ics` string contains a `SUMMARY` field with both the label and RFP name (e.g., `SUMMARY:Proposal Due - NHS RFP`). Run to confirm RED.
  - [x] 1.4 **Write failing test:** Add a test that verifies a deadline **without** a time produces an all-day event (the start DateArray has only 3 elements `[year, month, day]`, which the `ics` package renders as an all-day event — look for `VALUE=DATE` or verify no `T` timestamp in `DTSTART`). Run to confirm RED.
  - [x] 1.5 **Write failing test:** Add a test that verifies each event includes a `VALARM` with `TRIGGER:-P1D` (24-hour reminder). Run to confirm RED.
  - [x] 1.6 **Write failing test:** Add a test that verifies a deadline with a non-null `context` field includes that context as the `DESCRIPTION` in the `.ics` output. Run to confirm RED.
  - [x] 1.7 **Write failing test:** Add a test for `generateIcsForDeadlines` (plural) that accepts an array of deadlines and returns a single `.ics` string containing multiple `VEVENT` blocks. Verify the returned string contains `BEGIN:VEVENT` appearing once per deadline. Run to confirm RED.
  - [x] 1.8 **Implement:** Create `src/lib/ics-generator.ts`. Export two functions: `generateIcsForDeadline(deadline)` for a single deadline and `generateIcsForDeadlines(deadlines)` for bulk export. Use the `ics` package's `createEvent` and `createEvents` functions. Key implementation details:
    - Accept deadline data matching the shape `{ date: Date | string, time: string | null, label: string, context: string | null, rfpName: string }`.
    - For timed deadlines: create a `DateArray` of `[year, month, day, hour, minute]` with `duration: { hours: 1 }`. **Important:** `ics` months are 1-indexed (January = 1), which matches `getMonth() + 1`.
    - For all-day deadlines (time is null): use `DateArray` of `[year, month, day]` for start and `[year, month, day + 1]` for end (iCal spec: DTEND is exclusive).
    - Set `startInputType: 'utc'` and `startOutputType: 'utc'`.
    - Include a VALARM alarm: `{ action: 'display', description: 'Deadline reminder', trigger: { days: 1, before: true } }`.
    - Set `title` to `"${label} - ${rfpName}"` and `description` to the context field (if present).
    - For `createEvents`, pass `{ calName: 'RFP Deadline Tracker', productId: 'rfp-tracker/ics' }` as header attributes.
    - Return the `.ics` string, or throw an error if generation fails.
  - [x] 1.9 **Verify GREEN:** Run `npx jest src/lib/ics-generator.test.ts` — all tests must pass.
  - [x] 1.10 **Add edge case test:** Write a test for a deadline with an empty/null context — verify the output does NOT contain a `DESCRIPTION` field. Run to confirm GREEN.
  - [x] 1.11 **Add edge case test:** Write a test for `generateIcsForDeadlines` with an empty array — verify it throws an error or returns an empty string gracefully. Run to confirm GREEN.
  - [x] 1.12 **Full regression:** Run `npx jest` to confirm all existing tests still pass.
  - [x] 1.13 **Commit:** Stage and commit all changes with a descriptive message.
  - [x] 1.14 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [x] 2.0 Build calendar export API route (`src/app/api/export/route.ts`)
  - [x] 2.1 Merge `feature/ics-generator` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/export-api`
  - [x] 2.2 **Write failing test:** Create `src/app/api/export/route.test.ts` with `@jest-environment node` docblock. Set up database cleanup in `beforeEach` (delete all deadlines and RFPs). Write a test that creates an RFP and a deadline via Prisma, then calls `GET /api/export?deadlineId=<id>` and asserts the response has status 200, `Content-Type` header containing `text/calendar`, and body containing `BEGIN:VCALENDAR`. Run to confirm RED.
  - [x] 2.3 **Write failing test:** Add a test that verifies the response includes a `Content-Disposition` header with `attachment` and a `.ics` filename. Run to confirm RED.
  - [x] 2.4 **Write failing test:** Add a test for `GET /api/export?deadlineId=999` (non-existent ID) — assert it returns 404 with a JSON error. Run to confirm RED.
  - [x] 2.5 **Write failing test:** Add a test for `GET /api/export?deadlineId=abc` (invalid ID) — assert it returns 400. Run to confirm RED.
  - [x] 2.6 **Write failing test:** Add a test for bulk export `GET /api/export` (no params) — create multiple RFPs with deadlines (mix of Active and Won statuses, completed and incomplete). Assert the response contains only incomplete deadlines from Active RFPs. Verify the response body contains multiple `VEVENT` blocks. Run to confirm RED.
  - [x] 2.7 **Write failing test:** Add a test for bulk export when there are no qualifying deadlines — assert it returns 404 with a descriptive message. Run to confirm RED.
  - [x] 2.8 **Implement:** Create `src/app/api/export/route.ts` with a `GET` handler. Parse `deadlineId` from `request.nextUrl.searchParams`. Implementation:
    - **Single export (`deadlineId` provided):** Validate ID is a number (return 400 if not). Fetch the deadline with its parent RFP via `prisma.deadline.findUnique({ where: { id }, include: { rfp: true } })`. Return 404 if not found. Call `generateIcsForDeadline()` with the deadline data. Return `new Response(icsString, { headers })` with `Content-Type: text/calendar; charset=utf-8` and `Content-Disposition: attachment; filename="<slugified-label>.ics"`.
    - **Bulk export (no `deadlineId`):** Fetch all incomplete deadlines from Active RFPs: `prisma.deadline.findMany({ where: { completed: false, rfp: { status: 'Active' } }, include: { rfp: true }, orderBy: { date: 'asc' } })`. Return 404 if none found. Call `generateIcsForDeadlines()`. Return response with filename `rfp-deadlines-<YYYY-MM-DD>.ics`.
    - Wrap in try/catch — return 500 with JSON error on unexpected failures.
  - [x] 2.9 **Verify GREEN:** Run `npx jest src/app/api/export/route.test.ts` — all tests must pass.
  - [x] 2.10 **Full regression:** Run `npx jest` to confirm no regressions in existing tests.
  - [x] 2.11 **Commit:** Stage and commit all changes with a descriptive message.
  - [x] 2.12 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [x] 3.0 Build NotificationBanner component (`src/components/NotificationBanner.tsx`)
  - [x] 3.1 Merge `feature/export-api` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/notification-banner`
  - [x] 3.2 **Write failing test:** Create `src/components/NotificationBanner.test.tsx`. Write a test that renders `<NotificationBanner deadlines={[...]} now={fixedDate} />` with one deadline within 3 days (critical) and asserts the banner is visible with text matching "1 deadline" and "within 3 days". Use `now` prop set to a fixed date for deterministic testing. Run to confirm RED.
  - [x] 3.3 **Write failing test:** Add a test with multiple urgent deadlines (2 critical + 1 overdue) and verify the banner shows the correct count (e.g., "3 deadlines are due within 3 days"). Run to confirm RED.
  - [x] 3.4 **Write failing test:** Add a test with only safe/warning deadlines (none within 3 days) and verify the banner is NOT rendered (returns null). Run to confirm RED.
  - [x] 3.5 **Write failing test:** Add a test that clicks the dismiss button and verifies the banner disappears from the DOM. Run to confirm RED.
  - [x] 3.6 **Write failing test:** Add a test that clicks the expand toggle and verifies the individual deadline labels become visible in an expanded list. Run to confirm RED.
  - [x] 3.7 **Write failing test:** Add a test that completed deadlines are excluded even if their date is within 3 days — render with a completed critical deadline and verify the banner does NOT appear. Run to confirm RED.
  - [x] 3.8 **Implement:** Create `src/components/NotificationBanner.tsx` as a `'use client'` component. Props: `{ deadlines: DeadlineWithRfp[], now?: Date }`. Implementation:
    - Use `useState(false)` for `dismissed` and `useState(false)` for `expanded`.
    - Filter deadlines using `getUrgencyLevel()` from `@/lib/urgency` — keep only those with level `'critical'` or `'overdue'` (which excludes completed deadlines, since `getUrgencyLevel` returns `'completed'` for those).
    - Return `null` if dismissed or no urgent deadlines.
    - Render a `div` with `role="alert"`, red-toned Tailwind classes (`bg-red-50 border border-red-200 rounded-lg p-4 mb-4`).
    - Left side: warning icon (inline SVG or lucide-react `AlertTriangle`) + count text (e.g., "3 deadlines are due within 3 days").
    - Middle: expand/collapse chevron button toggling the `expanded` state.
    - Right side: dismiss (X) button setting `dismissed` to `true`.
    - When expanded: render a `<ul>` below the count text listing each urgent deadline's label and formatted date.
  - [x] 3.9 **Verify GREEN:** Run `npx jest src/components/NotificationBanner.test.tsx` — all tests must pass.
  - [x] 3.10 **Add edge case test:** Verify banner shows correctly with exactly 1 deadline (singular text: "1 deadline is due" not "1 deadlines are due"). Run to confirm GREEN.
  - [x] 3.11 **Full regression:** Run `npx jest` to confirm all existing tests still pass.
  - [x] 3.12 **Commit:** Stage and commit all changes with a descriptive message.
  - [x] 3.13 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [x] 4.0 Add export buttons to Dashboard and DeadlineTable
  - [x] 4.1 Merge `feature/notification-banner` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/export-buttons`
  - [x] 4.2 **Write failing test:** In `src/components/DeadlineTable.test.tsx`, add a test that verifies each deadline row contains an export link/button with an `href` attribute pointing to `/api/export?deadlineId=<id>`. Run to confirm RED.
  - [x] 4.3 **Modify DeadlineTable:** Add an "Actions" column header to the table. In each row, add an anchor element (`<a>`) styled as a small button/link with `href={/api/export?deadlineId=${deadline.id}}`, `download` attribute, and accessible text (e.g., `aria-label="Export to calendar"`). Use a calendar icon or the text "Export". Keep the styling subtle (e.g., `text-blue-600 hover:text-blue-800 text-sm`).
  - [x] 4.4 **Verify GREEN:** Run `npx jest src/components/DeadlineTable.test.tsx` — all tests (old + new) must pass.
  - [x] 4.5 **Write failing test:** In `src/components/Dashboard.test.tsx`, add a test that verifies an "Export All" button is rendered in the dashboard header area (when there are active incomplete deadlines). Run to confirm RED.
  - [x] 4.6 **Write failing test:** In `src/components/Dashboard.test.tsx`, add a test that verifies the "Export All" button has `href="/api/export"` and a `download` attribute. Run to confirm RED.
  - [x] 4.7 **Write failing test:** In `src/components/Dashboard.test.tsx`, add a test that verifies the `NotificationBanner` is rendered when urgent deadlines exist. Mock the fetch to return RFPs with critical deadlines, then verify the banner text appears. Run to confirm RED.
  - [x] 4.8 **Modify Dashboard:** Import `NotificationBanner` and render it between the update-error banner (line 212-216) and the SummaryCards section (line 221), passing `filteredDeadlines` as the `deadlines` prop. Add an "Export All" button (as an `<a>` element styled with the existing `Button` component) in the header row next to the "Show all RFPs" toggle, with `href="/api/export"` and `download="rfp-deadlines.ics"`.
  - [x] 4.9 **Verify GREEN:** Run `npx jest src/components/Dashboard.test.tsx` — all tests (old + new) must pass.
  - [x] 4.10 **Full regression:** Run `npx jest` to confirm zero regressions across all test files.
  - [x] 4.11 **Commit:** Stage and commit all changes with a descriptive message.
  - [x] 4.12 **CHECKPOINT — Wait for user to test and approve before merging to main.**

- [x] 5.0 Integration verification & final polish
  - [x] 5.1 Merge `feature/export-buttons` to `main` (after user approval), then create and checkout branch: `git checkout -b feature/final-polish`
  - [x] 5.2 Run the full test suite (`npx jest`) and verify all tests pass with zero failures.
  - [x] 5.3 Run `npm run build` to verify the production build succeeds with no TypeScript or compilation errors.
  - [x] 5.4 Run `npm run lint` to verify no linting errors were introduced.
  - [x] 5.5 Manually verify in the dev server (`npm run dev`): navigate to the dashboard, confirm the NotificationBanner appears when deadlines are within 3 days, confirm it dismisses, and confirm the expand/collapse toggle works.
  - [x] 5.6 Manually verify: click "Export" on a single deadline row, confirm a `.ics` file downloads with the correct filename and can be opened by a calendar application.
  - [x] 5.7 Manually verify: click "Export All" in the dashboard header, confirm a bulk `.ics` file downloads containing multiple events.
  - [x] 5.8 Update the parent task list `tasks/tasks-rfp-tracker.md` — check off task 7.0 and all its sub-tasks (7.1 through 7.6).
  - [ ] 5.9 **Commit** any polish changes with a descriptive message.
  - [ ] 5.10 **CHECKPOINT — Wait for user to test and approve before merging to main.**
