# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RFP Deadline Tracker — a single-user web dashboard for a public sector Sales Engineer (SE) at 8x8. Upload RFP documents via drag-and-drop, automatically extract all milestone dates using OpenAI (GPT-4o), and view/manage deadlines in a unified dashboard with urgency indicators and iCal export.

## Tech Stack

- **Framework:** Next.js with App Router, TypeScript, Tailwind CSS ✓
- **Database:** SQLite via Prisma ORM 7 with @prisma/adapter-better-sqlite3 ✓
- **Testing:** Jest with TypeScript support (ts-jest) ✓
- **AI:** OpenAI API (GPT-4o, including vision for scanned documents)
- **Document parsing:** pdf-parse, mammoth (DOCX), xlsx
- **Calendar export:** ics npm package
- **Google Calendar sync:** googleapis npm package (OAuth 2.0 integration)
- **Timezone:** All dates in Europe/London (GMT/BST)

### Prisma 7 Important Notes

- **Adapters are mandatory** in Prisma 7 - no direct database connections
- For local SQLite: Use `@prisma/adapter-better-sqlite3` (NOT @prisma/adapter-libsql)
- The `@prisma/adapter-libsql` is only for Turso/remote libSQL instances
- Database URL is configured in `prisma.config.ts`, not in `schema.prisma`
- Environment variables must be explicitly loaded (use dotenv in tests)

## Build & Dev Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npx prisma migrate dev --name <name>   # Create/apply database migration
npx prisma generate  # Regenerate Prisma client after schema changes
npx jest             # Run all tests
npx jest path/to/test  # Run a single test file
```

## Architecture

### API Routes (Next.js App Router)
- `src/app/api/rfps/` — CRUD for RFP entries
- `src/app/api/deadlines/` — CRUD for deadline entries
- `src/app/api/upload/` — Multipart file upload, saves to local `/uploads` directory
- `src/app/api/extract/` — Sends document content to OpenAI, returns structured date JSON
- `src/app/api/export/` — Generates .ics calendar files (single or bulk)

### Core Libraries
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/openai.ts` — OpenAI client, `extractDates()` for text, `extractDatesFromImage()` for vision
- `src/lib/file-parser.ts` — Unified `extractText(filepath, mimeType)` dispatching to pdf-parse/mammoth/xlsx
- `src/lib/ics-generator.ts` — .ics file generation from deadline data

### Database Models (Prisma) ✓ Implemented

- **Rfp:** id, name, agency, status (enum: Active/Won/Lost/NoBid/Archived), createdAt, updatedAt
- **Deadline:** id, rfpId (FK), date (DateTime), time (String?), label, context?, completed (default: false), createdAt, updatedAt
- **Document:** id, rfpId (FK), filename, filepath, mimeType, uploadedAt
- All foreign keys have `onDelete: Cascade` for automatic cleanup

### Key UI Components
- `UploadZone` — Drag-and-drop + file picker for document upload
- `DateReview` — Editable table of AI-extracted dates for user confirmation before saving
- `DeadlineTable` — Dashboard deadline list with urgency color-coding (red ≤3d, yellow ≤7d, green >7d, grey completed)
- `SummaryCard` — Count of deadlines due this week
- `NotificationBanner` — Alert banner for deadlines within 3 days

## Test-Driven Development

This project follows strict TDD. The cycle for every piece of functionality is:

1. **Red** — Write a failing test that defines the expected behaviour before writing any implementation code.
2. **Green** — Write the minimum implementation code to make the test pass.
3. **Refactor** — Clean up the implementation while keeping all tests green.

### TDD Rules

- Never write implementation code without a failing test first.
- Run the relevant test(s) after each change to confirm red → green progression.
- Keep tests small and focused — one behaviour per test.
- Name tests descriptively: `it("returns 404 when RFP does not exist")` not `it("works")`.
- When fixing a bug, first write a test that reproduces the bug, then fix it.

### Test Structure

- Test files live next to the code they test: `foo.ts` → `foo.test.ts`.
- Use `__mocks__/` directories for module-level mocks where needed.
- API route tests should use the Next.js test helpers or direct handler invocation — not a running server.
- React component tests use React Testing Library — test behaviour and rendered output, not implementation details.

### What to Mock

- **Always mock:** OpenAI API calls, filesystem I/O in unit tests.
- **Use real database for tests:** We use the actual SQLite database with the better-sqlite3 adapter for integration tests. Clean up between tests with `deleteMany()` in `beforeEach`.
- **Never mock:** Pure utility functions (urgency calculation, date formatting, .ics generation) — test these with real inputs/outputs.
- External service boundaries (OpenAI, file system) should have thin wrapper modules (`src/lib/openai.ts`, `src/lib/file-parser.ts`) that are easy to mock at the module level.

### Test Environment Setup

- Jest is configured to set `NODE_ENV=test` which triggers dotenv loading in `src/lib/db.ts`
- Database cleanup happens in `beforeEach` hooks using the real Prisma client
- The test database is the same as dev (`dev.db`) - acceptable for single-user local app

### Running Tests

```bash
npx jest                      # Run all tests
npx jest path/to/file.test.ts # Run a single test file
npx jest --watch              # Watch mode during development
npx jest --coverage           # Check coverage
```

## Workflow Rules

- PRDs are generated following `create-prd.md` and saved to `tasks/prd-[feature-name].md`
- Task lists are generated following `generate-tasks.md` and saved to `tasks/tasks-[feature-name].md`
- Each major task gets its own feature branch (e.g., `feature/project-setup`, `feature/database-schema`)
- Check off sub-tasks in the task file (`- [ ]` → `- [x]`) as they are completed
- **IMPORTANT:** Never merge feature branches to main without explicit user approval

## AI Extraction Prompt Contract

The OpenAI extraction prompt must return a JSON array of objects:
```json
[{ "date": "YYYY-MM-DD", "time": "HH:MM | null", "label": "string", "context": "string" }]
```
For large documents exceeding token limits, chunk text and merge results. For image files (PNG, JPG, TIFF), use GPT-4o vision API.

## Important Constraints

- Single-user, no authentication
- All data stored locally (SQLite DB + `/uploads` directory for files)
- OpenAI API key provided via `OPENAI_API_KEY` in `.env.local`
- Uploaded files stored on local disk, not in the database
- No email notifications — in-app banners and iCal export only
