/*
  Warnings:

  - You are about to drop the column `status` on the `flashcards` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[flashcardId,userId]` on the table `card_fsrs_data` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `card_fsrs_data` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "card_fsrs_data_due_idx";

-- DropIndex
DROP INDEX "card_fsrs_data_flashcardId_key";

-- AlterTable
ALTER TABLE "card_fsrs_data" ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "flashcards" DROP COLUMN "status",
ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "review_logs" ADD COLUMN     "isFatiguedReview" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- DropEnum
DROP TYPE "CardStatus";

-- CreateIndex
CREATE INDEX "card_fsrs_data_userId_due_idx" ON "card_fsrs_data"("userId", "due");

-- CreateIndex
CREATE UNIQUE INDEX "card_fsrs_data_flashcardId_userId_key" ON "card_fsrs_data"("flashcardId", "userId");

-- AddForeignKey
ALTER TABLE "card_fsrs_data" ADD CONSTRAINT "card_fsrs_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
