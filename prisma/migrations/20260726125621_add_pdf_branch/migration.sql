/*
  Warnings:

  - Added the required column `branch` to the `pdfs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "pdfs_semester_idx";

-- AlterTable
-- Existing rows get a placeholder branch (re-tag them via the admin panel
-- after this migration) since there's no prior branch data to backfill from.
ALTER TABLE "pdfs" ADD COLUMN     "branch" TEXT NOT NULL DEFAULT 'cse-core';
ALTER TABLE "pdfs" ALTER COLUMN "branch" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "pdfs_branch_semester_idx" ON "pdfs"("branch", "semester");
