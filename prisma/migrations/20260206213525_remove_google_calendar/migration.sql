/*
  Warnings:

  - You are about to drop the `GoogleAuth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `googleEventId` on the `Deadline` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GoogleAuth";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deadline" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rfpId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "label" TEXT NOT NULL,
    "context" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deadline_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Deadline" ("completed", "context", "createdAt", "date", "id", "label", "rfpId", "time", "updatedAt") SELECT "completed", "context", "createdAt", "date", "id", "label", "rfpId", "time", "updatedAt" FROM "Deadline";
DROP TABLE "Deadline";
ALTER TABLE "new_Deadline" RENAME TO "Deadline";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
