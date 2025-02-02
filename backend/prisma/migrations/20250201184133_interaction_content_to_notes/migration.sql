/*
  Warnings:

  - You are about to drop the column `content` on the `Interaction` table. All the data in the column will be lost.
  - Added the required column `notes` to the `Interaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Interaction" DROP COLUMN "content",
ADD COLUMN     "notes" TEXT NOT NULL;
