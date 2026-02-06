# PRD: Calendar View for Deadline Visualization

## 1. Introduction/Overview

The RFP Deadline Tracker currently displays deadlines in a sortable table with urgency colour-coding. While effective for scanning a flat list, it lacks spatial/temporal context — users cannot easily see how deadlines cluster across a week or month, spot gaps in their schedule, or understand workload distribution over time.

**Problem:** A table view shows deadlines as isolated rows. Users have no visual way to see how deadlines relate to each other in time, identify busy vs quiet periods, or get a calendar-oriented mental model of their upcoming workload.

**Goal:** Add an interactive calendar view (month + week) as a toggleable alternative to the existing deadline table on the dashboard. Deadlines appear as colour-coded events on the calendar, with click-to-view details and inline quick-editing — all powered by the @ilamy/calendar library for native Tailwind CSS + shadcn/ui integration.

## 2. Goals

1. Provide a month and week calendar view showing all deadlines as colour-coded events
2. Allow users to toggle between the existing table view and the new calendar view on the dashboard
3. Enable viewing deadline details via a popup/dialog when clicking a calendar event
4. Support quick-editing of deadline fields (date, label, completed) directly from the calendar popup
5. Maintain the existing urgency colour scheme (red/amber/green/grey) on calendar events
6. Display all dates correctly in UK timezone (Europe/London)

## 3. User Stories

- **As a Sales Engineer**, I want to see my deadlines on a monthly calendar so I can visualise how they are spread across the month and spot busy periods at a glance.
- **As a Sales Engineer**, I want to switch to a weekly calendar view so I can see a more detailed breakdown of the current or upcoming week.
- **As a Sales Engineer**, I want to toggle between the table and calendar views without losing my place so I can use whichever view suits the task at hand.
- **As a Sales Engineer**, I want to click a deadline event on the calendar to see its full details (date, time, label, context, RFP name) in a popup so I do not have to navigate away from the calendar.
- **As a Sales Engineer**, I want to quick-edit a deadline's date, label, or completion status from the calendar popup so I can make corrections without switching views.
- **As a Sales Engineer**, I want calendar events colour-coded by urgency (red for overdue/critical, amber for upcoming, green for safe, grey for completed) so I can instantly spot what needs attention.
- **As a Sales Engineer**, I want to navigate forward and backward by month or week so I can review past deadlines or plan ahead.

## 4. Functional Requirements

### View Toggle

1. A toggle control (e.g. segmented button group: "Table | Calendar") shall be added above the current deadline table area on the dashboard
2. The toggle shall default to "Table" (preserving the current experience)
3. Switching between views shall not trigger a data re-fetch — both views consume the same deadline dataset already loaded by the Dashboard component
4. The selected view preference should persist for the duration of the session (local component state is sufficient)

### Calendar Display (Month View)

5. The month view shall display a standard calendar grid (7 columns for days, 5-6 rows for weeks)
6. Each day cell shall display deadline events as small colour-coded chips/badges showing the truncated label
7. Days with more deadlines than can fit visually shall show a "+N more" indicator that can be expanded
8. The current day shall be visually highlighted
9. Month/year header shall display the currently viewed month with left/right navigation arrows
10. A "Today" button shall navigate back to the current month

### Calendar Display (Week View)

11. The week view shall display 7 day columns for the selected week
12. Each day column shall list all deadlines for that day with their label and time (if available)
13. Week header shall show the date range (e.g. "3 Feb - 9 Feb 2026") with left/right navigation arrows
14. A "Today" button shall navigate back to the current week

### View Switcher (Month/Week)

15. Within the calendar view, a secondary control shall allow switching between Month and Week views
16. The default calendar sub-view shall be Month
17. Clicking a day in the month view should switch to the week view for that week (drill-down navigation)

### Event Styling

18. Calendar events shall use the existing urgency colour scheme:
    - **Red** — overdue or due within 3 days (critical)
    - **Amber** — due within 7 days (warning)
    - **Green** — due in more than 7 days (safe)
    - **Grey** — completed deadlines
19. Completed deadlines shall appear with reduced opacity or strikethrough styling
20. Each event shall show the RFP name alongside the deadline label for identification

### Event Detail Popup

21. Clicking a deadline event on the calendar shall open a dialog/popover showing:
    - Deadline label
    - Date and time (formatted in Europe/London timezone)
    - Context (if available)
    - Associated RFP name (as a clickable link to the RFP detail view)
    - Completion status
22. The popup shall include a "View RFP" link/button that navigates to the associated RFP detail view

### Inline Quick-Edit

23. The event detail popup shall include an "Edit" mode that allows modifying:
    - Deadline label (text input)
    - Deadline date (date picker)
    - Completion status (checkbox/toggle)
24. Changes shall be saved via the existing `PATCH /api/deadlines/[id]` endpoint
25. After a successful save, the calendar shall update to reflect the changes without a full page reload
26. The popup shall show a loading state while saving and display errors if the save fails
27. A "Cancel" button shall discard unsaved changes and return to the read-only popup view

### Data & Filtering

28. The calendar shall display the same deadline dataset as the table view (filtered by active RFP status, etc.)
29. Any dashboard-level filters (e.g. RFP status filter) shall apply to both the table and calendar views
30. The calendar shall re-render when deadlines are updated, added, or removed via other parts of the UI

## 5. Non-Goals (Out of Scope)

- **Drag-and-drop rescheduling** of deadlines on the calendar (edit via popup only)
- **Day view** — month and week views are sufficient for the deadline use case
- **Creating new deadlines** from the calendar (deadlines are created via document upload/extraction)
- **Recurring events** — all deadlines are one-off dates
- **Multi-day events** — each deadline is a single point in time
- **Calendar export from this view** — the existing iCal export feature covers this need
- **Separate /calendar route** — the calendar lives on the dashboard as a toggle, not a separate page
- **Google Calendar integration** — previously descoped; this is a standalone in-app view

## 6. Design Considerations

### Library Choice

- **@ilamy/calendar** — selected for its native Tailwind CSS and shadcn/ui integration, which matches the project's existing design system exactly
- The library provides headless/unstyled calendar primitives that we style with our own Tailwind classes
- Supports month, week, day, and year views out of the box (we will use month + week)

### Visual Integration

- The calendar shall use the existing colour palette and design tokens (CSS custom properties) already defined in the project
- Event badges shall reuse or extend the existing `Badge` component from `src/components/ui/badge.tsx`
- The detail popup shall use the existing `Dialog` component from `src/components/ui/dialog.tsx`
- Navigation buttons shall use the existing `Button` component with appropriate variants
- The view toggle (Table | Calendar) shall use a segmented control styled consistently with the existing UI

### Responsive Behaviour

- On smaller screens, the month view should remain usable with truncated event labels
- The week view should be the default on narrow viewports where a full month grid would be cramped

## 7. Technical Considerations

### Dependencies

- Install `@ilamy/calendar` package
- No other new dependencies required — date-fns, Tailwind, Radix UI, and shadcn/ui components are already available

### Integration Points

- **Data source:** Reuse the `deadlines` state from the `Dashboard` component — no new API calls needed
- **Urgency calculation:** Reuse `getUrgencyLevel()` and `getUrgencyColor()` from `src/lib/urgency.ts`
- **Timezone handling:** Reuse date-fns-tz with `Europe/London` timezone, consistent with the rest of the app
- **Deadline updates:** Use the existing `PATCH /api/deadlines/[id]` endpoint for quick-edit saves
- **Types:** Use the existing `DeadlineWithRfp` type for calendar event data

### Component Architecture

- `CalendarView` — top-level component wrapping @ilamy/calendar, receives deadlines as props
- `CalendarEventItem` — renders a single deadline event chip on the calendar grid
- `CalendarEventPopup` — dialog showing deadline detail + quick-edit form
- The view toggle can be added to the existing `Dashboard` component, conditionally rendering `DeadlineTable` or `CalendarView`

### Performance

- The calendar should render efficiently with potentially 100+ deadlines visible in a month view
- Use React.memo or similar optimisations for event items if needed
- Only re-render affected day cells when a single deadline is updated

## 8. Success Metrics

1. Users can toggle between table and calendar views with no visible delay
2. All existing urgency colours are accurately reflected on calendar events
3. Clicking an event opens the detail popup within 200ms
4. Quick-edit saves complete successfully and update the calendar without full reload
5. Month and week navigation is responsive (< 100ms transition)
6. No regressions in existing deadline table functionality
7. All new components have passing tests following TDD methodology

## 9. Open Questions

1. Should the view toggle default preference be stored in localStorage so it persists across browser sessions, or is session-only state sufficient? Yes
2. Should completed deadlines be hidden on the calendar by default (with a toggle to show them), or always visible with grey/faded styling? Grey/faded
3. Does @ilamy/calendar support all the customisation hooks needed for our event styling, or will we need to wrap/extend its components? remains to be seen
