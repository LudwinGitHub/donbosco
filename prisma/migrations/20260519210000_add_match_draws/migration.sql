CREATE TABLE "match_draws" (
  "id"             TEXT NOT NULL,
  "matchId"        TEXT NOT NULL,
  "optionATeam1"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "optionATeam2"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "optionARating1" DOUBLE PRECISION NOT NULL,
  "optionARating2" DOUBLE PRECISION NOT NULL,
  "optionBTeam1"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "optionBTeam2"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "optionBRating1" DOUBLE PRECISION NOT NULL,
  "optionBRating2" DOUBLE PRECISION NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_draws_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "match_draws_matchId_key" ON "match_draws"("matchId");

ALTER TABLE "match_draws"
  ADD CONSTRAINT "match_draws_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "draw_votes" (
  "matchId" TEXT NOT NULL,
  "userId"  TEXT NOT NULL,
  "choice"  TEXT NOT NULL,
  CONSTRAINT "draw_votes_pkey" PRIMARY KEY ("matchId", "userId")
);

ALTER TABLE "draw_votes"
  ADD CONSTRAINT "draw_votes_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "match_draws"("matchId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "draw_votes"
  ADD CONSTRAINT "draw_votes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
