-- CreateTable
CREATE TABLE "VideoRelease" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "propertyAddress" TEXT,
    "bookingId" TEXT,
    "token" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signerName" TEXT,
    "signatureText" TEXT,
    "signerIp" TEXT,
    "signerUserAgent" TEXT,
    CONSTRAINT "VideoRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoRelease_token_key" ON "VideoRelease"("token");

-- AddForeignKey
ALTER TABLE "VideoRelease" ADD CONSTRAINT "VideoRelease_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
