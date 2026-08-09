/*
  Warnings:

  - The `studyMode` column on the `review_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deviceType` column on the `study_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `studyMode` column on the `study_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "review_logs" DROP COLUMN "studyMode",
ADD COLUMN     "studyMode" TEXT NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "study_sessions" DROP COLUMN "deviceType",
ADD COLUMN     "deviceType" TEXT NOT NULL DEFAULT 'WEB',
DROP COLUMN "studyMode",
ADD COLUMN     "studyMode" TEXT NOT NULL DEFAULT 'STANDARD';

-- DropEnum
DROP TYPE "DeviceType";

-- DropEnum
DROP TYPE "StudyMode";

-- CreateIndex
CREATE INDEX "review_logs_userId_createdAt_idx" ON "review_logs"("userId", "createdAt");
