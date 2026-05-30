/*
  Warnings:

  - You are about to drop the `cards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cards" DROP CONSTRAINT "cards_matchId_fkey";

-- DropForeignKey
ALTER TABLE "cards" DROP CONSTRAINT "cards_playerId_fkey";

-- DropForeignKey
ALTER TABLE "cards" DROP CONSTRAINT "cards_teamId_fkey";

-- DropTable
DROP TABLE "cards";

-- DropEnum
DROP TYPE "CardType";
