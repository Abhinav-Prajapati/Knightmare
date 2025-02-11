-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED', 'ABORTED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "GameOutcome" AS ENUM ('white_win', 'black_win', 'DRAW', 'ABANDONED');

-- CreateEnum
CREATE TYPE "WinMethod" AS ENUM ('CHECKMATE', 'RESIGNATION', 'TIMEOUT', 'draw_agreement', 'STALEMATE', 'insufficient_material', 'fifty_move_rule', 'threefold_repetition');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "best_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "current_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "games_drawn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "games_lost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "games_won" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profile_image_url" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "total_games_played" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "games" (
    "game_id" TEXT NOT NULL,
    "whitePlayerId" UUID,
    "blackPlayerId" UUID,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "initial_fen" VARCHAR(100) NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    "final_fen" VARCHAR(100),
    "pgn" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'WAITING',
    "outcome" "GameOutcome",
    "win_method" "WinMethod",

    CONSTRAINT "games_pkey" PRIMARY KEY ("game_id")
);

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
