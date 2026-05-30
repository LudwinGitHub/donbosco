ALTER TABLE "players" ADD COLUMN "userId" TEXT;
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");
