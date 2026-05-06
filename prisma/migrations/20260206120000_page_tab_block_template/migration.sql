-- Optional layout per tab / per block (alternating_blocks | text_image); NULL = inherit page default
ALTER TABLE "page_tabs" ADD COLUMN "template" TEXT;
ALTER TABLE "page_blocks" ADD COLUMN "template" TEXT;
