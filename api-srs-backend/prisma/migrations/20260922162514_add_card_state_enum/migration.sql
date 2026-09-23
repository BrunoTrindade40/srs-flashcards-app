/*
  Warnings:

  - The `state` column on the `card_fsrs_data` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CardState" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING', 'SUSPENDED');

-- AlterTable
ALTER TABLE "card_fsrs_data" DROP COLUMN "state",
ADD COLUMN     "state" "CardState" NOT NULL DEFAULT 'NEW';
