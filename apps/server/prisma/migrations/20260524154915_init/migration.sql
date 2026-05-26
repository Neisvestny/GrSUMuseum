-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "draft_document" SET DEFAULT '{"blocks":[]}'::jsonb;
