-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "tries" SET DEFAULT 1;
