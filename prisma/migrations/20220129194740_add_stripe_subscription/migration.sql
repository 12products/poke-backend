-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" BOOLEAN NOT NULL DEFAULT false;
