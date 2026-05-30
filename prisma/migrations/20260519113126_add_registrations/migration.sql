-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'WAITLIST');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "playerLimit" INTEGER NOT NULL DEFAULT 14;

-- CreateTable
CREATE TABLE "match_registrations" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_registrations_matchId_userId_key" ON "match_registrations"("matchId", "userId");

-- AddForeignKey
ALTER TABLE "match_registrations" ADD CONSTRAINT "match_registrations_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_registrations" ADD CONSTRAINT "match_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
