# Tasks: RFP Deadline Tracker Dashboard

## Relevant Files

- `package.json` - Project dependencies and scripts
- `.env.local` - Environment variables (OPENAI_API_KEY)
- `prisma/schema.prisma` - Database schema (RFPs, Deadlines, Documents)
- `src/lib/db.ts` - Prisma client singleton
- `src/lib/openai.ts` - OpenAI client and date extraction logic
- `src/lib/file-parser.ts` - Document text extraction utilities (PDF, DOCX, XLSX)
- `src/lib/ics-generator.ts` - iCal (.ics) file generation utility
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Main dashboard page
- `src/app/api/rfps/route.ts` - RFP list and create API
- `src/app/api/rfps/[id]/route.ts` - Single RFP get, update, delete API
- `src/app/api/deadlines/route.ts` - Deadline list and create API
- `src/app/api/deadlines/[id]/route.ts` - Single deadline update and delete API
- `src/app/api/upload/route.ts` - File upload API
- `src/app/api/extract/route.ts` - AI date extraction API
- `src/app/api/export/route.ts` - Calendar .ics export API
- `src/components/Dashboard.tsx` - Main dashboard component
- `src/components/DeadlineTable.tsx` - Deadline list/table with urgency indicators
- `src/components/UploadZone.tsx` - Drag-and-drop upload area
- `src/components/RfpForm.tsx` - RFP create/edit form
- `src/components/RfpDetail.tsx` - RFP detail/edit view
- `src/components/DateReview.tsx` - AI-extracted date review and confirmation UI
- `src/components/NotificationBanner.tsx` - Urgency notification banner
- `src/components/SummaryCard.tsx` - Weekly deadline summary card

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- All dates must be handled in UK timezone (Europe/London, GMT/BST).
- AI integration uses OpenAI API (GPT-4o) — requires a valid `OPENAI_API_KEY` in `.env.local`.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 1.0 Project setup & configuration
  - [x] 1.1 Initialize a git repository if not already initialized (`git init`)
  - [x] 1.2 Create and checkout a new feature branch (`git checkout -b feature/project-setup`)
  - [x] 1.3 Initialize a new Next.js project with TypeScript and App Router (`npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir`)
  - [x] 1.4 Install Prisma and initialize with SQLite (`npm install prisma @prisma/client && npx prisma init --datasource-provider sqlite`)
  - [x] 1.5 Install OpenAI SDK (`npm install openai`)
  - [x] 1.6 Install document parsing libraries (`npm install pdf-parse mammoth xlsx`)
  - [x] 1.7 Install calendar export library (`npm install ics`)
  - [x] 1.8 Install any additional UI utility libraries as needed (e.g., `clsx` for conditional classes, `date-fns` or `dayjs` for date manipulation with timezone support via `date-fns-tz` or `dayjs/plugin/timezone`)
  - [x] 1.9 Create `.env.local` with `OPENAI_API_KEY` placeholder and add `.env.local` to `.gitignore`
  - [x] 1.10 Verify the dev server runs successfully (`npm run dev`)

- [x] 2.0 Database schema & ORM setup
  - [x] 2.1 Create and checkout a new feature branch (`git checkout -b feature/database-schema`)
  - [x] 2.2 Define `Rfp` model in `prisma/schema.prisma` with fields: `id`, `name`, `agency`, `status` (enum: Active, Won, Lost, NoBid, Archived), `createdAt`, `updatedAt`
  - [x] 2.3 Define `Deadline` model with fields: `id`, `rfpId` (relation to Rfp), `date` (DateTime), `time` (String, nullable), `label`, `context` (nullable), `completed` (Boolean, default false), `createdAt`, `updatedAt`
  - [x] 2.4 Define `Document` model with fields: `id`, `rfpId` (relation to Rfp), `filename`, `filepath`, `mimeType`, `uploadedAt`
  - [x] 2.5 Run initial migration (`npx prisma migrate dev --name init`)
  - [x] 2.6 Create Prisma client singleton in `src/lib/db.ts`

- [x] 3.0 File upload & document handling
  - [x] 3.1 Create and checkout a new feature branch (`git checkout -b feature/file-upload`)
  - [x] 3.2 Create the `src/app/api/upload/route.ts` API route that accepts multipart form data
  - [x] 3.3 Implement local file storage — save uploaded files to a `/uploads` directory on disk, store the path in the Document table
  - [x] 3.4 Add `/uploads` to `.gitignore`
  - [x] 3.5 Create `src/lib/file-parser.ts` with a unified `extractText(filepath, mimeType)` function
  - [x] 3.6 Implement PDF text extraction using `pdf-parse`
  - [x] 3.7 Implement DOCX text extraction using `mammoth`
  - [x] 3.8 Implement XLSX text extraction using `xlsx` (convert sheet contents to readable text)
  - [x] 3.9 For image files (PNG, JPG, TIFF), skip text extraction and flag them for vision-based AI processing
  - [x] 3.10 Build the `UploadZone` React component with drag-and-drop support and a file-picker fallback button
  - [x] 3.11 Show upload progress/status indicator in the UI (loading spinner, success/error state)

- [x] 4.0 AI-powered date extraction
  - [x] 4.1 Create and checkout a new feature branch (`git checkout -b feature/ai-date-extraction`)
  - [x] 4.2 Create `src/lib/openai.ts` — initialize the OpenAI client using the API key from environment variables
  - [x] 4.3 Design the extraction prompt: instruct the model to return a JSON array of `{ "date": "YYYY-MM-DD", "time": "HH:MM" | null, "label": "string", "context": "string" }` objects, emphasizing extraction of *all* dates found in the document
  - [x] 4.4 Implement a `extractDates(text: string)` function that sends extracted text to OpenAI (GPT-4o) and parses the structured JSON response
  - [x] 4.5 Implement a `extractDatesFromImage(filepath: string)` function that sends image files to GPT-4o's vision API for date extraction
  - [x] 4.6 Add error handling for API failures, malformed responses, and rate limits
  - [x] 4.7 Handle large documents: if extracted text exceeds token limits, chunk the text into segments and merge results
  - [x] 4.8 Create `src/app/api/extract/route.ts` API route that accepts a document ID, extracts text (or uses vision), calls OpenAI, and returns extracted dates
  - [x] 4.9 Build the `DateReview` component — display AI-extracted dates in an editable table/list where the user can edit labels, correct dates, delete false positives, or add missed dates
  - [x] 4.10 Add a "Confirm & Save" button on the DateReview component that persists the reviewed dates to the Deadline table in the database

- [x] 5.0 RFP management
  - [x] 5.1 Create and checkout a new feature branch (`git checkout -b feature/rfp-management`)
  - [x] 5.2 Create `src/app/api/rfps/route.ts` with GET (list all RFPs) and POST (create new RFP) handlers
  - [x] 5.3 Create `src/app/api/rfps/[id]/route.ts` with GET (single RFP with deadlines), PUT (update RFP), and DELETE (delete RFP and associated data) handlers
  - [x] 5.4 Create `src/app/api/deadlines/route.ts` with POST (create deadline) handler
  - [x] 5.5 Create `src/app/api/deadlines/[id]/route.ts` with PUT (update deadline) and DELETE (delete deadline) handlers
  - [x] 5.6 Build the `RfpForm` component — a form/modal for creating a new RFP (name, agency, status) that also triggers the upload flow
  - [x] 5.7 Build the `RfpDetail` component — displays RFP info, its deadlines, and attached documents, with edit capabilities
  - [x] 5.8 Implement RFP status management — ability to change status between Active, Won, Lost, No-Bid, and Archived
  - [x] 5.9 Implement manual deadline add/edit/delete within the RFP detail view
  - [x] 5.10 Wire up the full upload-to-extraction flow: user uploads document → file is saved → text extracted → AI extracts dates → user reviews → dates saved → RFP created or updated

- [x] 6.0 Dashboard UI & deadline visualization — **See `tasks/tasks-dashboard-ui.md` for detailed sub-tasks**

- [ ] 7.0 In-app notifications & calendar export — **See `tasks/tasks-notifications-calendar-export.md` for detailed sub-tasks**

- [ ] 8.0 Testing & final polish
  - [ ] 8.1 Create and checkout a new feature branch (`git checkout -b feature/testing-polish`)
  - [ ] 8.2 Test document upload with each supported format (PDF, DOCX, XLSX, PNG, JPG, TIFF) and verify files are stored correctly
  - [ ] 8.3 Test AI date extraction with a sample RFP document and verify dates are correctly identified and structured
  - [ ] 8.4 Test the date review flow — edit, delete, and add dates manually, then confirm and verify they persist
  - [ ] 8.5 Test RFP CRUD — create, edit status, delete, and verify cascade behavior (deleting RFP removes deadlines and documents)
  - [ ] 8.6 Test urgency color-coding with deadlines at various date ranges (overdue, 1 day, 5 days, 14 days)
  - [ ] 8.7 Test `.ics` export — download individual and bulk exports, import into a calendar app, verify dates and labels
  - [ ] 8.8 Test timezone handling — verify all dates display correctly in Europe/London timezone
  - [ ] 8.9 Test notification banner appears when deadlines are within 3 days and does not appear otherwise
  - [ ] 8.10 UI polish — verify consistent styling, loading states, error messages, and empty states throughout the app
  - [ ] 8.11 Add error handling for edge cases: empty documents, documents with no dates, API key missing, network failures
