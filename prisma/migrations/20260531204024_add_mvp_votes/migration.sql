-- CreateTable
CREATE TABLE "match_mvp_votes" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "nomineeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_mvp_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_mvp_votes_matchId_voterId_key" ON "match_mvp_votes"("matchId", "voterId");

-- AddForeignKey
ALTER TABLE "match_mvp_votes" ADD CONSTRAINT "match_mvp_votes_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_mvp_votes" ADD CONSTRAINT "match_mvp_votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_mvp_votes" ADD CONSTRAINT "match_mvp_votes_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
