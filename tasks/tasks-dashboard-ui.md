# Tasks: Dashboard UI & Deadline Visualization

## Relevant Files

- `src/lib/urgency.ts` - Pure utility for urgency level calculations (uses date-fns + date-fns-tz)
- `src/lib/urgency.test.ts` - Unit tests for urgency utility
- `src/types/index.ts` - Shared TypeScript interfaces (Rfp, Deadline, DeadlineWithRfp, RfpStatus)
- `src/components/ui/` - shadcn/ui generated components (Table, Badge, Card, Dialog, Button, ScrollArea, Separator)
- `src/components/Dashboard.tsx` - Main dashboard orchestrator component
- `src/components/Dashboard.test.tsx` - Tests for Dashboard component
- `src/components/Sidebar.tsx` - RFP list sidebar with navigation and "New RFP" button
- `src/components/Sidebar.test.tsx` - Tests for Sidebar component
- `src/components/SummaryCards.tsx` - Summary stat cards (Overdue, Due This Week, Active RFPs, Upcoming 7 Days)
- `src/components/SummaryCards.test.tsx` - Tests for SummaryCards component
- `src/components/DeadlineTable.tsx` - Sortable deadline table with urgency indicators and completion toggles
- `src/components/DeadlineTable.test.tsx` - Tests for DeadlineTable component
- `src/components/NewRfpDialog.tsx` - Multi-step modal wizard (Create → Upload → Review)
- `src/components/NewRfpDialog.test.tsx` - Tests for NewRfpDialog component
- `src/app/page.tsx` - Updated to render Dashboard instead of UploadDemo
- `src/app/globals.css` - Updated with shadcn/ui CSS variables

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- This project follows strict TDD — write failing tests before implementation code.
- shadcn/ui components are installed via CLI (`npx shadcn@latest add <component>`) and generated into `src/components/ui/`.
- All date/urgency calculations must use Europe/London timezone.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `feature/dashboard-ui` from `main`

- [ ] 1.0 Install and configure shadcn/ui
  - [x] 1.1 Create and checkout branch `feature/dashboard-shadcn-setup` from `feature/dashboard-ui`
  - [x] 1.2 Run `npx shadcn@latest init` to initialise shadcn/ui (select default style, CSS variables enabled)
  - [x] 1.3 Remove the dark mode `@media (prefers-color-scheme: dark)` block from `src/app/globals.css` (not needed)
  - [x] 1.4 Install required shadcn/ui components: `npx shadcn@latest add table badge card dialog button scroll-area separator`
  - [x] 1.5 Add `ResizeObserver` polyfill to `jest.setup.ts` for Radix UI compatibility in tests
  - [x] 1.6 Verify `npm run build` still passes with shadcn/ui installed
  - [x] 1.7 Verify all existing tests still pass (`npx jest`)
  - [x] 1.8 **Manual UI check:** Run `npm run dev`, open http://localhost:3000 — existing app still works. Check `src/components/ui/` directory contains the installed shadcn components

- [x] 1.0 Install and configure shadcn/ui

- [ ] 2.0 Create shared types and urgency utility
  - [x] 2.1 Create and checkout branch `feature/dashboard-types-urgency` from `feature/dashboard-ui`
  - [x] 2.2 Create `src/types/index.ts` with shared interfaces: `RfpStatus` enum/union, `Deadline`, `Rfp` (with nested deadlines and documents), `DeadlineWithRfp` (deadline flattened with RFP name/agency/status)
  - [x] 2.3 Write failing tests for `src/lib/urgency.ts` covering: overdue returns "overdue", date today or within 3 days returns "critical", 4–7 days returns "warning", >7 days returns "safe", completed deadline always returns "completed" regardless of date
  - [x] 2.4 Write failing tests for timezone correctness: urgency calculated using Europe/London timezone (a date that is "today" in London but "yesterday" in UTC during BST)
  - [x] 2.5 Write failing tests for `getUrgencyColor()` helper: returns correct Tailwind classes (dot colour and row background) for each urgency level
  - [x] 2.6 Implement `getUrgencyLevel(date: string, completed: boolean, now?: Date)` in `src/lib/urgency.ts` using `date-fns` and `date-fns-tz` with Europe/London timezone
  - [x] 2.7 Implement `getUrgencyColor(level: UrgencyLevel)` returning `{ dot: string, bg: string }` Tailwind class strings
  - [x] 2.8 Verify all urgency tests pass
  - [x] 2.9 Create `src/app/preview/page.tsx` — a temporary preview page that renders a sample list of urgency levels with their colour dots (all 5 levels: overdue, critical, warning, safe, completed) using hardcoded test dates so you can visually verify the colour scheme
  - [x] 2.10 **Manual UI check:** Run `npm run dev`, open http://localhost:3000/preview — verify all 5 urgency colour dots render correctly (red, red, amber, green, grey)

- [x] 2.0 Create shared types and urgency utility

- [ ] 3.0 Build Sidebar component
  - [x] 3.1 Create and checkout branch `feature/dashboard-sidebar` from `feature/dashboard-ui`
  - [x] 3.2 Write failing tests for Sidebar: renders list of RFP names, displays agency and status badge for each RFP, shows deadline count per RFP
  - [x] 3.3 Write failing tests for Sidebar: highlights the currently selected RFP, calls `onSelectRfp` callback when an RFP is clicked
  - [x] 3.4 Write failing tests for Sidebar: renders a "New RFP" button that calls `onNewRfp` callback when clicked
  - [x] 3.5 Write failing test for Sidebar: displays status badges with correct colours (Blue=Active, Green=Won, Red=Lost, Grey=NoBid/Archived)
  - [x] 3.6 Implement `Sidebar` component in `src/components/Sidebar.tsx` with props: `rfps`, `selectedRfpId`, `onSelectRfp`, `onNewRfp`
  - [x] 3.7 Style Sidebar: fixed width ~288px, scrollable RFP list using `ScrollArea`, `Separator` between header and list
  - [x] 3.8 Verify all Sidebar tests pass
  - [x] 3.9 Update `src/app/preview/page.tsx` to render the Sidebar with 3–4 sample RFPs (mix of statuses), one pre-selected. Wire `onSelectRfp` and `onNewRfp` to `console.log`
  - [x] 3.10 **Manual UI check:** Run `npm run dev`, open http://localhost:3000/preview — verify Sidebar renders RFP list with status badges, selected RFP is highlighted, "New RFP" button is visible. Click items and check browser console for callbacks

- [x] 3.0 Build Sidebar component

- [ ] 4.0 Build SummaryCards component
  - [x] 4.1 Create and checkout branch `feature/dashboard-summary-cards` from `feature/dashboard-ui`
  - [x] 4.2 Write failing tests for SummaryCards: renders 4 cards with correct titles — "Due This Week", "Overdue", "Active RFPs", "Upcoming 7 Days"
  - [x] 4.3 Write failing tests for SummaryCards: correctly computes "Overdue" count (incomplete deadlines before today, Europe/London)
  - [x] 4.4 Write failing tests for SummaryCards: correctly computes "Due This Week" count (incomplete deadlines within current Mon–Sun week, Europe/London)
  - [x] 4.5 Write failing tests for SummaryCards: correctly computes "Upcoming 7 Days" count (incomplete deadlines within next 7 calendar days)
  - [x] 4.6 Write failing tests for SummaryCards: correctly computes "Active RFPs" count from provided RFP data
  - [x] 4.7 Write failing test for SummaryCards: completed deadlines are excluded from all date-based counts
  - [x] 4.8 Implement `SummaryCards` component in `src/components/SummaryCards.tsx` with props: `deadlines: DeadlineWithRfp[]`, `rfps: Rfp[]`, `now?: Date`
  - [x] 4.9 Style SummaryCards as a responsive grid of shadcn `Card` components
  - [x] 4.10 Verify all SummaryCards tests pass
  - [x] 4.11 Update `src/app/preview/page.tsx` to render SummaryCards with sample deadline and RFP data (include overdue, due-this-week, upcoming, and completed deadlines)
  - [x] 4.12 **Manual UI check:** Run `npm run dev`, open http://localhost:3000/preview — verify 4 summary cards render with correct counts matching the sample data

- [x] 4.0 Build SummaryCards component

- [ ] 5.0 Build DeadlineTable component
  - [x] 5.1 Create and checkout branch `feature/dashboard-deadline-table` from `feature/dashboard-ui`
  - [x] 5.2 Write failing tests for DeadlineTable: renders table headers (urgency, date, time, label, RFP name, completed)
  - [x] 5.3 Write failing tests for DeadlineTable: renders deadline rows with correct data, dates formatted as dd MMM yyyy (UK), time shows "—" when null
  - [x] 5.4 Write failing tests for DeadlineTable: displays urgency colour dot matching the deadline's urgency level
  - [x] 5.5 Write failing tests for DeadlineTable: rows are sorted by date ascending by default
  - [x] 5.6 Write failing tests for DeadlineTable: clicking a column header toggles sort direction; clicking a different header sorts by that column ascending
  - [x] 5.7 Write failing tests for DeadlineTable: RFP name in each row is clickable and calls `onSelectRfp` with the correct RFP ID
  - [x] 5.8 Write failing tests for DeadlineTable: clicking the completed checkbox calls `onToggleComplete` with the deadline ID and new completed state
  - [x] 5.9 Write failing test for DeadlineTable: shows empty state message when no deadlines are provided
  - [x] 5.10 Implement `DeadlineTable` component in `src/components/DeadlineTable.tsx` with props: `deadlines: DeadlineWithRfp[]`, `onSelectRfp`, `onToggleComplete`, `now?: Date`
  - [x] 5.11 Style table rows with urgency background colours (red-50, amber-50, green-50, grey-50) using `getUrgencyColor()`
  - [x] 5.12 Verify all DeadlineTable tests pass
  - [x] 5.13 Update `src/app/preview/page.tsx` to render DeadlineTable with sample deadlines covering all urgency levels (overdue, critical, warning, safe, completed, and one with null time). Wire `onSelectRfp` and `onToggleComplete` to `console.log`
  - [x] 5.14 **Manual UI check:** Run `npm run dev`, open http://localhost:3000/preview — verify table renders with colour-coded rows, sortable columns work, "—" shows for null times, clicking RFP name and checkbox logs to console

- [x] 5.0 Build DeadlineTable component

- [x] 6.0 Build NewRfpDialog component
  - [x] 6.1 Create and checkout branch `feature/dashboard-new-rfp-dialog` from `feature/dashboard-ui`
  - [x] 6.2 Write failing tests for NewRfpDialog: renders dialog when `open` prop is true, does not render when false
  - [x] 6.3 Write failing tests for NewRfpDialog: Step 1 shows the RfpForm component; submitting the form advances to Step 2
  - [x] 6.4 Write failing tests for NewRfpDialog: Step 2 shows the UploadZone component; after upload + extraction completes, advances to Step 3
  - [x] 6.5 Write failing tests for NewRfpDialog: Step 3 shows the DateReview component; saving dates calls `onComplete` and closes the dialog
  - [x] 6.6 Write failing test for NewRfpDialog: cancelling at any step calls `onClose`
  - [x] 6.7 Implement `NewRfpDialog` component in `src/components/NewRfpDialog.tsx` with props: `open`, `onClose`, `onComplete`
  - [x] 6.8 Wire multi-step wizard state: `step` (1/2/3), `createdRfpId`, pass data between steps
  - [x] 6.9 Wrap content in shadcn `Dialog` component with appropriate title per step
  - [x] 6.10 Verify all NewRfpDialog tests pass
  - [x] 6.11 Update `src/app/preview/page.tsx` to add an "Open New RFP Dialog" button that opens the NewRfpDialog. Wire `onComplete` and `onClose` to `console.log`
  - [x] 6.12 **Manual UI check:** Run `npm run dev`, open http://localhost:3000/preview — click "Open New RFP Dialog", verify 3-step wizard works: Step 1 shows RFP form, Step 2 shows upload zone, Step 3 shows date review. Verify cancel closes the dialog

- [ ] 7.0 Build Dashboard orchestrator and integrate into page
  - [x] 7.1 Create and checkout branch `feature/dashboard-orchestrator` from `feature/dashboard-ui`
  - [x] 7.2 Write failing tests for Dashboard: fetches data from `GET /api/rfps` on mount and renders Sidebar, SummaryCards, and DeadlineTable
  - [x] 7.3 Write failing tests for Dashboard: default view shows "Active only" filter — deadlines from non-Active RFPs are hidden
  - [x] 7.4 Write failing tests for Dashboard: toggling the filter shows/hides deadlines from non-Active RFPs, and summary cards update accordingly
  - [x] 7.5 Write failing tests for Dashboard: clicking an RFP in the sidebar or table shows the RfpDetail view; "Back to Dashboard" returns to the deadline table
  - [x] 7.6 Write failing tests for Dashboard: clicking "New RFP" opens the NewRfpDialog; completing the wizard refreshes dashboard data
  - [x] 7.7 Write failing tests for Dashboard: toggling a deadline's completed checkbox calls `PUT /api/deadlines/[id]` and refreshes data
  - [x] 7.8 Implement `Dashboard` component in `src/components/Dashboard.tsx` with state: `rfps`, `selectedRfpId`, `showAll` filter toggle, `dialogOpen`
  - [x] 7.9 Implement `refreshData()` function that fetches `GET /api/rfps` and updates state
  - [x] 7.10 Implement derived data: flatten deadlines with RFP info into `DeadlineWithRfp[]`, apply filter, compute summary counts
  - [x] 7.11 Compose layout: sidebar on left, main content (header with filter toggle, SummaryCards, DeadlineTable or RfpDetail) on right
  - [x] 7.12 Update `src/app/page.tsx` to render `Dashboard` instead of `UploadDemo`
  - [x] 7.13 Delete `src/app/preview/page.tsx` — temporary preview page no longer needed
  - [x] 7.14 Verify all Dashboard tests pass
  - [x] 7.15 Run full test suite (`npx jest`) — all existing and new tests pass
  - [x] 7.16 Run `npm run build` — production build succeeds with no errors
  - [ ] 7.17 **Manual UI check:** Run `npm run dev`, open http://localhost:3000 — verify full dashboard: sidebar shows RFPs, summary cards show correct counts, deadline table is colour-coded and sortable, "Active only" filter works, clicking an RFP shows detail view with "Back to Dashboard", "New RFP" dialog wizard completes end-to-end, toggling deadline completion updates the table
