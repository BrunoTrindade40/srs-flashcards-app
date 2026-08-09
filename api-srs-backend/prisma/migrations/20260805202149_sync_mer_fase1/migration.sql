/*
  Warnings:

  - You are about to drop the column `bpm` on the `biometric_logs` table. All the data in the column will be lost.
  - You are about to drop the column `fatigueLevel` on the `biometric_logs` table. All the data in the column will be lost.
  - You are about to drop the column `back` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `front` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `finishAt` on the `study_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `study_sessions` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `biometric_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `biometric_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `backContent` to the `flashcards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frontContent` to the `flashcards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `due` to the `review_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledDays` to the `review_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `review_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "biometric_logs" DROP COLUMN "bpm",
DROP COLUMN "fatigueLevel",
ADD COLUMN     "avgHeartRate" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fatigueIndex" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "decks" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" UUID,
ADD COLUMN     "price" DECIMAL(10,2),
ALTER COLUMN "targetLanguage" SET DEFAULT 'en-US';

-- AlterTable
ALTER TABLE "flashcards" DROP COLUMN "back",
DROP COLUMN "front",
ADD COLUMN     "aiModelSource" TEXT,
ADD COLUMN     "backContent" TEXT NOT NULL,
ADD COLUMN     "frontContent" TEXT NOT NULL,
ADD COLUMN     "isEditedAfterAi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "review_logs" ADD COLUMN     "due" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledDays" INTEGER NOT NULL,
ADD COLUMN     "sessionId" UUID,
ADD COLUMN     "state" INTEGER NOT NULL,
ADD COLUMN     "studyMode" "StudyMode" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "reviewDurationMs" DROP NOT NULL,
ALTER COLUMN "stabilityBefore" SET DEFAULT 0,
ALTER COLUMN "difficultyBefore" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "study_sessions" DROP COLUMN "finishAt",
DROP COLUMN "startAt",
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "colorHex" TEXT;

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "dailyRolloverTime" TEXT DEFAULT '04:00',
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "focusWindowStart" TEXT,
    "focusWindowEnd" TEXT,
    "messagingPlatform" TEXT,
    "messagingContact" TEXT,
    "fsrsWeights" JSONB,
    "dailyNewCardLimit" INTEGER NOT NULL DEFAULT 20,
    "maxDailyReviews" INTEGER NOT NULL DEFAULT 100,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deckId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "flashcardId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "deckId" UUID NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "enrollments"("userId");

-- CreateIndex
CREATE INDEX "enrollments_deckId_idx" ON "enrollments"("deckId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_deckId_key" ON "enrollments"("userId", "deckId");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_logs" ADD CONSTRAINT "biometric_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
