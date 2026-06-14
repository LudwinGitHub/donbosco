-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RegistrationStatus" ADD VALUE 'PENDING';
ALTER TYPE "RegistrationStatus" ADD VALUE 'DROPPED';

-- AlterTable
ALTER TABLE "match_registrations" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "slot" INTEGER;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "phase1Processed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phase2Processed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "match_group_slots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_group_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_group_slots_userId_key" ON "match_group_slots"("userId");

-- AddForeignKey
ALTER TABLE "match_group_slots" ADD CONSTRAINT "match_group_slots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
