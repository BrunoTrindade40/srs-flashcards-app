/*
  Warnings:

  - The primary key for the `review_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `review_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
/* Intervenção manual: Cast direto de texto para UUID mantendo os dados intactos */
ALTER TABLE "review_logs" 
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
