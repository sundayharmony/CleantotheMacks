-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "sqft" TEXT,
    "homeSize" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT DEFAULT 'NEW'
);
INSERT INTO "new_Booking" ("address", "createdAt", "email", "homeSize", "id", "name", "notes", "phone", "sqft", "status") SELECT "address", "createdAt", "email", "homeSize", "id", "name", "notes", "phone", "sqft", "status" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
