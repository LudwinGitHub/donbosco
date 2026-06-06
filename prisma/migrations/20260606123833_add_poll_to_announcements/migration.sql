-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "pollOptA" TEXT,
ADD COLUMN     "pollOptB" TEXT,
ADD COLUMN     "pollOptC" TEXT,
ADD COLUMN     "pollOptD" TEXT,
ADD COLUMN     "pollQuestion" TEXT;

-- CreateTable
CREATE TABLE "announcement_poll_votes" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_poll_votes_announcementId_userId_key" ON "announcement_poll_votes"("announcementId", "userId");

-- AddForeignKey
ALTER TABLE "announcement_poll_votes" ADD CONSTRAINT "announcement_poll_votes_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_poll_votes" ADD CONSTRAINT "announcement_poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
