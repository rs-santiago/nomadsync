-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "startTime" TIMESTAMP(3),
ALTER COLUMN "cost" DROP NOT NULL;
