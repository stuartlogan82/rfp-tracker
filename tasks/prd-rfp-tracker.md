# PRD: RFP Deadline Tracker Dashboard

## 1. Introduction / Overview

Sales Engineers working public sector deals receive RFP (Request for Proposal) documents that contain critical deadlines — submission dates, Q&A windows, pre-bid conferences, oral presentations, and more. Missing any of these dates can disqualify a bid.

The **RFP Deadline Tracker** is a single-user web dashboard that lets an SE drag-and-drop RFP documents onto the page, automatically extract every important date using AI, and view all upcoming deadlines in one place — with in-app visual alerts and the ability to export deadlines to a calendar.

## 2. Goals

- **Centralize deadline tracking:** Replace spreadsheets, sticky notes, and manual calendar entries with a single source of truth for all RFP deadlines.
- **Automate date extraction:** Use AI to parse uploaded RFP documents and identify all dates and their meanings, removing manual data entry.
- **Prevent missed deadlines:** Surface upcoming and overdue dates through color-coded urgency indicators and iCal export for calendar reminders.
- **Support all common document formats:** Accept PDFs, Word docs, Excel files, and scanned images so the user never needs to convert files first.

## 3. User Stories

1. **As an SE**, I want to drag and drop an RFP document onto the dashboard so that I don't have to manually type in dates.
2. **As an SE**, I want the system to automatically find and label all important dates in the document so that I don't have to read through the entire RFP.
3. **As an SE**, I want to see all my upcoming deadlines in a single dashboard view so that I can quickly understand what's due and when.
4. **As an SE**, I want deadlines to be color-coded by urgency (e.g., red for imminent, yellow for upcoming, green for distant) so I can prioritize at a glance.
5. **As an SE**, I want to export deadlines to my calendar (iCal) so I get native reminders on my phone and desktop.
6. **As an SE**, I want to manually edit or add dates after AI extraction so I can correct any mistakes or add dates the AI missed.
7. **As an SE**, I want to see which RFP a deadline belongs to so I can keep track of multiple active bids.
8. **As an SE**, I want to mark an RFP as won, lost, or no-bid so I can archive it and declutter the active view.

## 4. Functional Requirements

### Document Upload & Parsing

1. The system must provide a drag-and-drop zone on the dashboard for uploading RFP documents.
2. The system must also provide a traditional file-picker button as a fallback.
3. The system must accept the following file formats: PDF, DOCX, XLSX, PNG, JPG, and TIFF (scanned documents).
4. Upon upload, the system must send the document content to the OpenAI API with a prompt requesting extraction of all dates and their associated context/meaning.
5. The AI response must be parsed into structured date records, each containing:
   - **Date** (the actual date/time)
   - **Label** (what the date represents, e.g., "Clarification Questions Due", "Proposal Submission Deadline")
   - **Source RFP** (linked back to the uploaded document)
6. The system must store extracted dates and allow the user to review, edit, or delete them before confirming.
7. The system must store the original uploaded document for reference/re-download.

### RFP Management

8. The system must allow the user to create an RFP entry with at minimum: a name/title, an associated agency or organization, and a status.
9. RFP status options must include: **Active**, **Won**, **Lost**, **No-Bid**, and **Archived**.
10. The system must allow the user to edit RFP details (name, agency, status) at any time.
11. The system must allow the user to manually add, edit, or delete deadline entries on any RFP.

### Dashboard & Visualization

12. The dashboard must display a list/table of all upcoming deadlines across all active RFPs, sorted by date (soonest first).
13. Each deadline row must show: the date, the label, the parent RFP name, and a urgency indicator.
14. Urgency indicators must be color-coded:
    - **Red:** Deadline is within 3 days (or overdue).
    - **Yellow/Amber:** Deadline is within 7 days.
    - **Green:** Deadline is more than 7 days away.
    - **Grey:** Deadline has passed and was completed.
15. The dashboard must have a filter/toggle to show or hide deadlines from non-active RFPs (Won, Lost, No-Bid, Archived).
16. The dashboard must display a summary banner or card at the top showing the count of deadlines due this week.

### Notifications & Calendar Export

17. The system must display an in-app notification banner when any deadline is within 3 days.
18. The system must provide an "Export to Calendar" button on any individual deadline that downloads an `.ics` file for that event.
19. The system must provide a "Export All" option that downloads a single `.ics` file containing all upcoming deadlines from active RFPs.

### Data Persistence

20. The system must persist all data (RFPs, deadlines, uploaded documents) across browser sessions using a local database (e.g., SQLite via an API, or similar).
21. The system must not require user authentication (single-user app).

## 5. Non-Goals (Out of Scope)

- **Multi-user / team collaboration:** This is a single-user tool. No user accounts, roles, or shared access.
- **Email notifications:** Only in-app alerts and iCal export are in scope. Sending actual emails is not required.
- **RFP response authoring:** The tool tracks deadlines only. It does not help write or assemble the proposal response.
- **Integration with CRM or other systems:** No Salesforce, HubSpot, or other external system integration.
- **Mobile-native app:** The dashboard is a web app. Responsive design is nice-to-have but not a primary requirement.
- **OCR engine hosting:** For scanned images, OpenAI's vision capabilities will be used rather than a dedicated OCR pipeline.
- **Duplicate detection:** Not required. The volume of RFPs is low enough that this is not a concern.

## 6. Design Considerations

- **Layout:** A clean, minimal dashboard. The primary view is a deadline table/list sorted by date. A sidebar or secondary view shows RFP details.
- **Drag-and-drop zone:** Should be prominent — either a large area at the top of the page or accessible via a clear "Upload RFP" button that opens a drop zone modal.
- **Urgency colors:** Use established convention — red/amber/green. Ensure sufficient contrast for readability.
- **Tech stack recommendation:**
  - **Frontend:** Next.js (React) with Tailwind CSS for rapid UI development.
  - **Backend:** Next.js API routes.
  - **Database:** SQLite (via Prisma or Drizzle ORM) for zero-config local persistence.
  - **AI Integration:** OpenAI API (supports vision for scanned docs, strong at structured extraction). API key provided by employer.
  - **File handling:** Store uploaded files on local disk; use libraries like `pdf-parse` or pass directly to OpenAI's multimodal API.
  - **Calendar export:** Use the `ics` npm package to generate `.ics` files.

## 7. Technical Considerations

- **AI prompt design:** The extraction prompt should instruct the model to return a JSON array of `{ "date": "YYYY-MM-DD", "time": "HH:MM" | null, "label": "string", "context": "string" }` objects. The prompt should emphasize extracting *all* dates, not just common ones.
- **Document size limits:** Large RFPs (100+ pages) may exceed AI context windows. Consider chunking documents or extracting text first and sending in segments.
- **Scanned document support:** Rely on OpenAI's vision capability (e.g., GPT-4o) for image-based documents. If quality is poor, surface a warning to the user suggesting they upload a text-based version.
- **Cost management:** Each document upload triggers an AI API call. Consider caching results and showing the user a cost indicator (e.g., estimated tokens).
- **Local-first:** All data lives locally. No cloud database. This keeps it simple and private.
- **Timezone:** All dates must be stored and displayed in UK timezone (Europe/London, GMT/BST). No per-RFP timezone configuration needed.

## 8. Success Metrics

- **Date extraction accuracy:** The AI correctly identifies 90%+ of dates from a standard RFP document on first pass (user needs to manually fix fewer than 1 in 10 dates).
- **Time saved:** Uploading and confirming dates via the tool is faster than manually reading the RFP and entering dates into a spreadsheet.
- **Zero missed deadlines:** Once an RFP is uploaded, the user has visibility into all deadlines and does not miss any.
- **Daily usage:** The dashboard becomes the user's go-to view for checking what's due — opened at least once per workday.

## 9. Resolved Questions

1. **AI provider:** OpenAI (work-provided API key). Use GPT-4o for multimodal/vision support.
2. **Deadline reminder thresholds:** Fixed at 3-day (red) and 7-day (yellow) for v1.
3. **Duplicate detection:** Not needed — low volume of RFPs.
4. **Timezone:** All UK timezone (Europe/London, GMT/BST).

## 10. Open Questions

_None at this time. All clarifications have been resolved._
