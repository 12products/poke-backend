/*
  Warnings:

  - You are about to drop the column `description` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Reminder` table. All the data in the column will be lost.
  - Added the required column `text` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `notificationTime` on the `Reminder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "text" TEXT NOT NULL,
DROP COLUMN "notificationTime",
ADD COLUMN     "notificationTime" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Message_reminderId_key" ON "Message"("reminderId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
