-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "serviceType" TEXT;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "preferredDay" TEXT,
    "preferredTime" TEXT,
    "specialInstructions" TEXT,
    "pets" TEXT,
    "accessCodes" TEXT,
    "communicationNotes" TEXT,
    "referralSource" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cleaner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'hourly',
    "hourlyRate" DOUBLE PRECISION,

    CONSTRAINT "Cleaner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "clockInTime" TIMESTAMP(3),
    "clockOutTime" TIMESTAMP(3),
    "flatRateAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "completionNotes" TEXT,
    "totalPay" DOUBLE PRECISION,

    CONSTRAINT "CleaningJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisfactionNote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SatisfactionNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cleaner_email_key" ON "Cleaner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningJob_bookingId_key" ON "CleaningJob"("bookingId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningJob" ADD CONSTRAINT "CleaningJob_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningJob" ADD CONSTRAINT "CleaningJob_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionNote" ADD CONSTRAINT "SatisfactionNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
