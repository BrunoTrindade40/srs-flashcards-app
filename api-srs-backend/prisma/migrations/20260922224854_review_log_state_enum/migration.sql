/*
  Warnings:

  - Changed the type of `state` on the `review_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "review_logs" DROP COLUMN "state",
ADD COLUMN     "state" "CardState" NOT NULL;
