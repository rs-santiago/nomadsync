-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "participants" TEXT[] DEFAULT ARRAY[]::TEXT[];
