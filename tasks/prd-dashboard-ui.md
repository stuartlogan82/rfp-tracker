# PRD: Dashboard UI & Deadline Visualization

## 1. Introduction/Overview

The RFP Deadline Tracker currently provides a linear workflow for creating RFPs and extracting dates from uploaded documents. However, there is no unified dashboard for viewing and managing deadlines across all RFPs. This feature transforms the application from a single-task upload tool into a full dashboard experience with at-a-glance deadline visibility, urgency indicators, and streamlined navigation.

**Problem:** Users have no way to see all their deadlines in one place, understand which are urgent, or quickly navigate between RFPs. The current UI only supports one RFP workflow at a time.

**Goal:** Build a professional, responsive dashboard that surfaces all deadlines with urgency color-coding, provides quick access to all RFPs via a sidebar, and integrates the existing upload workflow into a modal dialog — all without breaking existing functionality.

## 2. Goals

1. Provide a single-screen overview of all deadlines across all RFPs, sorted by urgency
2. Enable instant visual identification of overdue and upcoming deadlines through color-coding
3. Allow quick navigation between RFPs via a persistent sidebar
4. Surface key metrics (overdue count, due this week, upcoming) in summary cards
5. Integrate the existing RFP creation/upload/extraction flow into a non-disruptive modal dialog
6. Display all dates correctly in UK timezone (Europe/London)

## 3. User Stories

- **As a Sales Engineer**, I want to see all my RFP deadlines on one screen so I can prioritise my week without switching between RFPs.
- **As a Sales Engineer**, I want deadlines colour-coded by urgency (red for imminent/overdue, amber for upcoming, green for safe) so I can instantly spot what needs attention.
- **As a Sales Engineer**, I want summary cards showing how many deadlines are overdue and due this week so I get a quick status check when I open the app.
- **As a Sales Engineer**, I want to click an RFP name in the deadline table to jump straight to its detail view so I can review or edit it without extra navigation.
- **As a Sales Engineer**, I want to filter the deadline table to only show active RFPs so completed/lost/archived RFP deadlines don't clutter my view.
- **As a Sales Engineer**, I want to create a new RFP and upload documents without leaving the dashboard so my workflow is uninterrupted.
- **As a Sales Engineer**, I want to mark a deadline as complete directly from the table so I can update status without opening the RFP detail.

## 4. Functional Requirements

### Layout & Navigation

1. The dashboard shall use a sidebar + main content layout
2. The left sidebar (fixed width ~288px) shall display a scrollable list of all RFPs
3. Each sidebar RFP entry shall show: name, agency, status badge, and deadline count
4. The currently selected RFP shall be visually highlighted in the sidebar
5. A "New RFP" button at the top of the sidebar shall open the creation dialog
6. The main content area shall contain: a header bar, summary cards row, and either the deadline table (default) or an RFP detail view (when an RFP is selected)
7. A "Back to Dashboard" action shall return from RFP detail view to the deadline table

### Summary Cards

8. The dashboard shall display 4 summary stat cards in a responsive grid:
   - **Due This Week**: count of incomplete deadlines within the current Monday–Sunday week (Europe/London)
   - **Overdue**: count of incomplete deadlines with dates before today
   - **Active RFPs**: count of RFPs with status "Active"
   - **Upcoming 7 Days**: count of incomplete deadlines within the next 7 calendar days
9. All card counts shall update when the filter toggle changes or data is mutated

### Deadline Table

10. The deadline table shall display columns: urgency indicator, date (UK format), time, label, RFP name, and completed checkbox
11. Deadlines shall be sorted by date ascending (soonest first) by default
12. Column headers shall be clickable to change sort column and direction
13. The RFP name in each row shall be clickable, navigating to the RFP detail view
14. Clicking the completed checkbox shall immediately update the deadline via `PUT /api/deadlines/[id]`
15. The table shall show an empty state message when no deadlines exist

### Urgency Color-Coding

16. Urgency levels shall be calculated as follows:
    - **Red (overdue)**: deadline date is before today and not completed
    - **Red (critical)**: deadline date is within 3 days (inclusive of today) and not completed
    - **Amber (warning)**: deadline date is within 4–7 days and not completed
    - **Green (safe)**: deadline date is more than 7 days away and not completed
    - **Grey (completed)**: deadline is marked as completed, regardless of date
17. Urgency shall be calculated using Europe/London timezone
18. Each deadline row shall display a coloured urgency dot/badge matching its level

### Filtering

19. A toggle/switch in the header shall allow showing or hiding deadlines from non-active RFPs (Won, Lost, NoBid, Archived)
20. The default state shall be "Active only" (show only deadlines from Active RFPs)
21. The filter shall apply to both the deadline table and the summary card counts

### New RFP Dialog

22. The "New RFP" action shall open a modal dialog
23. The dialog shall present a multi-step wizard:
    - Step 1: RFP creation form (name, agency, status) — uses existing `RfpForm` component
    - Step 2: Document upload — uses existing `UploadZone` component, auto-triggers AI extraction
    - Step 3: Date review — uses existing `DateReview` component
24. On completion (dates saved), the dialog shall close and the dashboard shall refresh with the new data
25. Cancelling at any step shall close the dialog without side effects (except an RFP created in step 1 will persist)

### Timezone

26. All displayed dates shall use Europe/London timezone formatting (dd MMM yyyy)
27. All urgency calculations shall use Europe/London timezone
28. Time values shall display as provided (HH:MM) or show "—" when null

## 5. Non-Goals (Out of Scope)

- Dark mode support
- Drag-and-drop reordering of deadlines
- Real-time updates / WebSocket connections
- Pagination of the deadline table (acceptable for single-user scale)
- Charts or trend visualisation (stat cards only)
- Notification banner (covered by Task 7.0)
- Calendar export functionality (covered by Task 7.0)
- Mobile-optimised responsive layout (desktop-first, basic responsiveness only)
- Migration of existing components to shadcn/ui styling (they continue to work as-is)

## 6. Design Considerations

### Component Library

- **shadcn/ui** shall be used for new dashboard components (Table, Badge, Card, Dialog, Button, Select, Separator, ScrollArea)
- shadcn/ui is installed via CLI and generates components into `src/components/ui/`
- Existing components (RfpForm, UploadZone, DateReview, RfpDetail) are reused without modification inside the new layout/dialog

### Visual Hierarchy

- Summary cards at the top provide the quick status overview
- Deadline table dominates the main content area as the primary working surface
- Sidebar provides persistent navigation context
- Urgency colours draw the eye to items needing attention

### Status Badge Colours

| RFP Status | Badge Colour |
|------------|-------------|
| Active     | Blue        |
| Won        | Green       |
| Lost       | Red         |
| NoBid      | Grey        |
| Archived   | Grey        |

### Urgency Indicator Colours

| Level     | Dot/Badge | Row Background |
|-----------|-----------|----------------|
| Overdue   | Red-500   | Red-50         |
| Critical  | Red-400   | Red-50         |
| Warning   | Amber-400 | Amber-50       |
| Safe      | Green-400 | Green-50       |
| Completed | Grey-300  | Grey-50        |

## 7. Technical Considerations

### State Management

- All dashboard state lives in a single `Dashboard` component (no external state library)
- Data is fetched via `GET /api/rfps` which returns all RFPs with nested deadlines and documents
- A `refreshData()` function re-fetches after any mutation (create RFP, toggle complete, etc.)
- Derived data (flattened deadlines, filtered lists, summary counts) is computed during render, not stored in state

### Urgency Utility

- A pure utility module (`src/lib/urgency.ts`) handles all urgency calculations
- Uses `date-fns` `differenceInCalendarDays` and `date-fns-tz` `toZonedTime` (both already installed)
- Accepts injectable `now` parameter for deterministic testing

### Shared Types

- A new `src/types/index.ts` file centralises TypeScript interfaces (Rfp, Deadline, DeadlineWithRfp, RfpStatus) used across dashboard components

### Migration Safety

- All new components are built alongside existing ones — no existing files are deleted
- The only existing file that changes behaviour is `src/app/page.tsx` (swaps `UploadDemo` for `Dashboard`)
- Reverting `page.tsx` instantly restores the previous UI

### shadcn/ui + Tailwind v4

- The project uses Tailwind CSS v4 with `@tailwindcss/postcss` (CSS-first config, no `tailwind.config.ts`)
- shadcn CLI auto-detects Tailwind v4 and configures accordingly
- The existing `globals.css` dark mode media query will be removed (not needed)

### Testing

- All new components follow TDD (failing test first)
- Urgency utility: pure unit tests (~12)
- UI components: React Testing Library tests with mocked fetch (~40)
- All existing tests must continue to pass at every step
- Radix UI primitives may need `ResizeObserver` polyfill in `jest.setup.ts`

## 8. Success Metrics

- All deadlines from all RFPs are visible on a single dashboard screen
- Urgency colour-coding correctly reflects deadline proximity (verified by unit tests with fixed dates)
- Summary card counts match the visible filtered deadline data
- The full RFP creation workflow (create -> upload -> extract -> review -> save) works end-to-end via the modal dialog
- All ~50 new tests pass alongside all existing tests
- `npm run build` produces a successful production build
- All dates display correctly in Europe/London timezone

## 9. Open Questions

- Should the sidebar be collapsible on smaller screens? (Deferred — desktop-first for now)
- Should the "completed" toggle in the deadline table use optimistic UI or wait for API response? (Recommendation: optimistic with rollback on error)
- Should we add keyboard shortcuts for common actions (e.g., "N" for New RFP)? (Deferred to future enhancement)
