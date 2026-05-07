-- AlterTable
ALTER TABLE "page_tabs" ADD COLUMN     "media" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "media" JSONB NOT NULL DEFAULT '[]';
