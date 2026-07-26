-- AlterTable
ALTER TABLE "users" ADD COLUMN     "session_invalidated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
