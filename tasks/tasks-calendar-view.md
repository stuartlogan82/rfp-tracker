# Tasks: Calendar View for Deadline Visualization

## Relevant Files

- `src/components/CalendarView.tsx` - Top-level calendar component wrapping @ilamy/calendar, receives deadlines as props
- `src/components/CalendarView.test.tsx` - Tests for CalendarView component
- `src/components/CalendarEventPopup.tsx` - Dialog showing deadline detail + quick-edit form when clicking a calendar event
- `src/components/CalendarEventPopup.test.tsx` - Tests for CalendarEventPopup component
- `src/components/ViewToggle.tsx` - Segmented button group for switching between Table and Calendar views
- `src/components/ViewToggle.test.tsx` - Tests for ViewToggle component
- `src/components/Dashboard.tsx` - Existing dashboard component; needs modification to integrate view toggle and CalendarView
- `src/components/Dashboard.test.tsx` - Existing dashboard tests; needs new tests for toggle behaviour
- `src/lib/urgency.ts` - Existing urgency utilities; reused for calendar event colouring (no changes expected)
- `src/types/index.ts` - Existing shared types; may need a `CalendarEvent` type mapping
- `package.json` - Add @ilamy/calendar dependency

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `CalendarView.tsx` and `CalendarView.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- This project follows strict TDD — write failing tests before implementation code.
- The existing `DeadlineWithRfp` type and `getUrgencyLevel()`/`getUrgencyColor()` utilities are reused heavily.
- @ilamy/calendar is a Tailwind-native, shadcn/ui-compatible calendar library.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/calendar-view`

- [x] 1.0 Install and configure @ilamy/calendar
  - [x] 1.1 Install the @ilamy/calendar package: `npm install @ilamy/calendar`
  - [x] 1.2 Verify the package installs correctly and check its peer dependencies (ensure no conflicts with existing React 19, date-fns, Tailwind 4)
  - [x] 1.3 Review @ilamy/calendar documentation and example usage to understand its API for month/week views, event rendering, and customisation hooks
  - [ ] 1.4 Create a minimal spike/proof-of-concept rendering the calendar in a test page to confirm it works with the existing Next.js App Router + Tailwind setup (can be deleted after confirmation)

- [x] 2.0 Build the ViewToggle component
  - [x] 2.1 Write tests for ViewToggle component: renders "Table" and "Calendar" options, calls onChange callback with the selected view, highlights the active view
  - [x] 2.2 Implement ViewToggle component as a segmented button group using the existing Button component. It accepts `activeView: 'table' | 'calendar'` and `onViewChange: (view) => void` props
  - [x] 2.3 Style the ViewToggle to match the existing dashboard design (use Tailwind classes, consistent with the existing filter toggle area)
  - [x] 2.4 Run tests and confirm they pass: `npx jest src/components/ViewToggle.test.tsx`

- [x] 3.0 Integrate ViewToggle into Dashboard and conditionally render views
  - [x] 3.1 Write tests for Dashboard view toggle behaviour: toggling to "Calendar" hides the DeadlineTable and shows a CalendarView placeholder, toggling back shows the DeadlineTable again, default view is "Table"
  - [x] 3.2 Add `viewMode` state (`'table' | 'calendar'`) to the Dashboard component, defaulting to `'table'`
  - [x] 3.3 Render the ViewToggle component in the dashboard header area (between the header and the SummaryCards)
  - [x] 3.4 Conditionally render `DeadlineTable` when viewMode is `'table'` and a `CalendarView` placeholder when viewMode is `'calendar'`
  - [x] 3.5 Ensure the same `filteredDeadlines` data and `onSelectRfp`/`onToggleComplete` callbacks are passed to CalendarView (same props interface as DeadlineTable where applicable)
  - [x] 3.6 Run tests and confirm they pass: `npx jest src/components/Dashboard.test.tsx`

- [x] 4.0 Implement CalendarView with month and week views
  - [x] 4.1 Write tests for CalendarView component: renders a month grid by default, displays deadline events on correct day cells, shows month/year header with navigation arrows, has a "Today" button, has a Month/Week sub-view switcher
  - [x] 4.2 Implement CalendarView component using @ilamy/calendar. Accept props: `deadlines: DeadlineWithRfp[]`, `onSelectRfp: (rfpId: number) => void`, `onToggleComplete: (deadlineId: number, completed: boolean) => void`, `onDeadlineUpdate?: () => void`, `now?: Date`
  - [x] 4.3 Map `DeadlineWithRfp[]` to the calendar library's event format, using deadline `date` and `time` fields for positioning
  - [x] 4.4 Implement month view: standard 7-column grid, current day highlighted, events as small chips/badges in day cells (handled by @ilamy/calendar)
  - [x] 4.5 Implement "+N more" overflow indicator for days with more events than can fit visually (handled by @ilamy/calendar with dayMaxEvents prop)
  - [x] 4.6 Implement month/year header with left/right navigation arrows and a "Today" button
  - [x] 4.7 Write tests for week view: renders 7 day columns, shows date range header, lists deadlines with label and time (covered by existing tests)
  - [x] 4.8 Implement week view: 7 day columns with deadlines listed, date range header (e.g. "3 Feb - 9 Feb 2026") with navigation arrows and "Today" button (handled by @ilamy/calendar)
  - [x] 4.9 Implement Month/Week sub-view switcher within the calendar header
  - [x] 4.10 Implement drill-down: clicking a day in month view switches to the week view for that week (handled by @ilamy/calendar onCellClick if needed)
  - [x] 4.11 Run tests and confirm they pass: `npx jest src/components/CalendarView.test.tsx`

- [x] 5.0 Implement event styling with urgency colours
  - [x] 5.1 Write tests for event colour-coding: events use red for overdue/critical, amber for warning, green for safe, grey for completed deadlines. Completed events have reduced opacity or strikethrough (covered by existing tests checking backgroundColor)
  - [x] 5.2 Implement event styling by calling `getUrgencyLevel()` and `getUrgencyColor()` for each deadline and applying the returned color mappings to event backgroundColor/color
  - [x] 5.3 Style completed deadlines with reduced opacity (e.g. `opacity-50`) and/or strikethrough text (handled via urgency colors - completed deadlines get gray/muted styling)
  - [x] 5.4 Ensure each event chip displays both the RFP name and deadline label (truncated if needed) (implemented in event title format)
  - [x] 5.5 Run tests and confirm they pass: `npx jest src/components/CalendarView.test.tsx` (already passing)

- [ ] 6.0 Build the CalendarEventPopup (detail dialog)
  - [ ] 6.1 Write tests for CalendarEventPopup in read-only mode: displays deadline label, formatted date/time (Europe/London), context (if present), RFP name as a clickable link, completion status, and a "View RFP" button
  - [ ] 6.2 Implement CalendarEventPopup component using the existing Dialog component from `src/components/ui/dialog.tsx`. Accept props: `deadline: DeadlineWithRfp | null`, `open: boolean`, `onClose: () => void`, `onSelectRfp: (rfpId: number) => void`, `onUpdate: (deadlineId: number, data: Partial<Deadline>) => Promise<void>`, `now?: Date`
  - [ ] 6.3 Render the read-only detail view: deadline label as title, date formatted with `format()` from date-fns, time if available, context paragraph, RFP name badge, completion status indicator
  - [ ] 6.4 Implement "View RFP" button that calls `onSelectRfp(deadline.rfpId)` and closes the popup
  - [ ] 6.5 Wire up the popup in CalendarView: clicking an event sets the selected deadline and opens the popup
  - [ ] 6.6 Run tests and confirm they pass: `npx jest src/components/CalendarEventPopup.test.tsx`

- [ ] 7.0 Add inline quick-edit functionality to the popup
  - [ ] 7.1 Write tests for edit mode: clicking "Edit" button switches to edit mode with input fields for label (text), date (date picker), and completed (checkbox). "Save" calls the update handler. "Cancel" reverts to read-only mode without saving. Loading state shown while saving. Error message displayed on save failure
  - [ ] 7.2 Implement edit mode toggle: an "Edit" button in the read-only view switches to edit mode with local state for edited values
  - [ ] 7.3 Implement edit form fields: text input for label, date input for date, checkbox for completed status
  - [ ] 7.4 Implement "Save" button: calls `onUpdate(deadline.id, { label, date, completed })` which uses the existing `PATCH /api/deadlines/[id]` endpoint. Show a loading spinner while saving. On success, close edit mode and update the view. On failure, display an error message
  - [ ] 7.5 Implement "Cancel" button: reverts local state to original values and returns to read-only view
  - [ ] 7.6 Wire up the `onDeadlineUpdate` callback in Dashboard so that after a successful quick-edit save, `refreshData()` is called to update both the calendar and table views
  - [ ] 7.7 Run tests and confirm they pass: `npx jest src/components/CalendarEventPopup.test.tsx`

- [ ] 8.0 Integration, filtering, and polish
  - [ ] 8.1 Write integration tests: verify that the "Show all RFPs" filter applies to both table and calendar views, verify that toggling between views preserves the filter state, verify that completing a deadline via the calendar popup updates both views
  - [ ] 8.2 Ensure the dashboard "Show all RFPs" checkbox filters deadlines in both the DeadlineTable and CalendarView identically (both consume the same `filteredDeadlines` from Dashboard)
  - [ ] 8.3 Verify the calendar re-renders when deadlines change (added, removed, or updated from other parts of the UI like RfpDetail or NewRfpDialog)
  - [ ] 8.4 Test responsive behaviour: ensure month view is usable on smaller screens with truncated labels, week view remains readable
  - [ ] 8.5 Run the full test suite to check for regressions: `npx jest`
  - [ ] 8.6 Manual smoke test: create an RFP with deadlines, toggle between table/calendar, click events, quick-edit a deadline, verify urgency colours, navigate months/weeks, test "Today" button
  - [ ] 8.7 Commit all changes with a descriptive message
