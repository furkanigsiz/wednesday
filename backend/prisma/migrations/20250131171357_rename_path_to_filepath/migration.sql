/*
  Warnings:

  - You are about to drop the column `path` on the `TaskFile` table. All the data in the column will be lost.
  - Added the required column `filePath` to the `TaskFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskFile" DROP COLUMN "path",
ADD COLUMN     "filePath" TEXT NOT NULL;
