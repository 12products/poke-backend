/*
  Warnings:

  - Changed the type of `notificationTime` on the `Reminder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "notificationTime",
ADD COLUMN     "notificationTime" TIME(0) NOT NULL;
