/*
  Warnings:

  - You are about to drop the column `status` on the `flashcards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "flashcards" DROP COLUMN "status",
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true;
