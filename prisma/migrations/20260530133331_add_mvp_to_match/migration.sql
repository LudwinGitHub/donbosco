-- AlterTable
ALTER TABLE "match_draws" ALTER COLUMN "optionATeam1" DROP DEFAULT,
ALTER COLUMN "optionATeam2" DROP DEFAULT,
ALTER COLUMN "optionBTeam1" DROP DEFAULT,
ALTER COLUMN "optionBTeam2" DROP DEFAULT;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "mvpPlayerId" TEXT;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_mvpPlayerId_fkey" FOREIGN KEY ("mvpPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
