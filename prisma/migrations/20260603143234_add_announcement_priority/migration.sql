-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL';
