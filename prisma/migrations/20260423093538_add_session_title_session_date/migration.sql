/*
  Warnings:

  - Added the required column `session_date` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_title` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "session_date" TEXT NOT NULL,
ADD COLUMN     "session_title" TEXT NOT NULL;
