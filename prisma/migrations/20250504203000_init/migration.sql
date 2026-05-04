-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "cms_entities" (
	"id" SERIAL NOT NULL,
	"entity_type" TEXT NOT NULL,
	"slug" TEXT NOT NULL,
	"title" TEXT NOT NULL,
	"data" JSONB NOT NULL DEFAULT '{}',
	"status" TEXT NOT NULL DEFAULT 'draft',
	"detail_page_id" INTEGER,
	"created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "cms_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_page_blocks" (
	"id" SERIAL NOT NULL,
	"page_id" INTEGER NOT NULL,
	"type" TEXT NOT NULL,
	"position" INTEGER NOT NULL,
	"payload" JSONB NOT NULL DEFAULT '{}',
	"is_visible" BOOLEAN NOT NULL DEFAULT TRUE,
	"payload_version" INTEGER NOT NULL DEFAULT 1,
	"created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "cms_page_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_pages" (
	"id" SERIAL NOT NULL,
	"parent_id" INTEGER,
	"slug" TEXT NOT NULL,
	"full_path" TEXT NOT NULL,
	"title" TEXT NOT NULL,
	"kind" TEXT NOT NULL DEFAULT 'page',
	"status" TEXT NOT NULL DEFAULT 'published',
	"nav_title" TEXT,
	"meta_title" TEXT,
	"meta_description" TEXT,
	"show_in_nav" BOOLEAN NOT NULL DEFAULT TRUE,
	"sort_order" INTEGER NOT NULL DEFAULT 1,
	"legacy_page_id" INTEGER,
	"created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_redirects" (
	"id" SERIAL NOT NULL,
	"from_path" TEXT NOT NULL,
	"to_path" TEXT NOT NULL,
	"http_code" INTEGER NOT NULL DEFAULT 301,
	"created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "cms_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_photos" (
	"id" SERIAL NOT NULL,
	"src" TEXT NOT NULL,
	"title" TEXT NOT NULL,
	"annotation" TEXT NOT NULL DEFAULT '',
	"year" INTEGER NOT NULL,
	"position" INTEGER NOT NULL DEFAULT 1,
	CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_videos" (
	"id" SERIAL NOT NULL,
	"src" TEXT NOT NULL,
	"title" TEXT NOT NULL,
	"description" TEXT NOT NULL DEFAULT '',
	"tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
	"duration" TEXT,
	"is_external" BOOLEAN NOT NULL DEFAULT FALSE,
	"position" INTEGER NOT NULL DEFAULT 1,
	CONSTRAINT "gallery_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
	"id" SERIAL NOT NULL,
	"section" TEXT NOT NULL,
	"position" INTEGER NOT NULL,
	"label" TEXT NOT NULL,
	"path" TEXT NOT NULL DEFAULT '',
	"is_active" BOOLEAN NOT NULL DEFAULT TRUE,
	CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_blocks" (
	"id" SERIAL NOT NULL,
	"page_id" INTEGER,
	"tab_id" INTEGER,
	"position" INTEGER NOT NULL,
	"img" TEXT,
	CONSTRAINT "page_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_paragraphs" (
	"id" SERIAL NOT NULL,
	"block_id" INTEGER NOT NULL,
	"position" INTEGER NOT NULL,
	"text" TEXT NOT NULL,
	CONSTRAINT "page_paragraphs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_tabs" (
	"id" SERIAL NOT NULL,
	"page_id" INTEGER NOT NULL,
	"position" INTEGER NOT NULL,
	"label" TEXT NOT NULL,
	CONSTRAINT "page_tabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
	"id" SERIAL NOT NULL,
	"slug" TEXT NOT NULL,
	"title" TEXT NOT NULL,
	"template" TEXT NOT NULL DEFAULT 'tabs_alternating',
	CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rectors" (
	"id" SERIAL NOT NULL,
	"position" INTEGER NOT NULL DEFAULT 1,
	"name" TEXT NOT NULL DEFAULT '',
	"years" TEXT NOT NULL DEFAULT '',
	"description" TEXT NOT NULL DEFAULT '',
	"full_text" TEXT NOT NULL DEFAULT '',
	"img" TEXT NOT NULL DEFAULT '',
	"images" TEXT[] DEFAULT ARRAY[]::TEXT[],
	"files" JSONB NOT NULL DEFAULT '[]',
	CONSTRAINT "rectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
	"id" SERIAL NOT NULL,
	"section" VARCHAR(10) NOT NULL,
	"position" INTEGER NOT NULL,
	"name" VARCHAR(255) NOT NULL DEFAULT 'Новый преподаватель',
	"role" VARCHAR(255) NOT NULL DEFAULT '',
	"description" TEXT NOT NULL DEFAULT '',
	"img" VARCHAR(500) NOT NULL DEFAULT '',
	"created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "teachers_pkey" PRIMARY KEY ("section", "position")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_entities_entity_type_slug_key" ON "cms_entities" ("entity_type", "slug");

-- CreateIndex
CREATE INDEX "cms_page_blocks_payload_gin" ON "cms_page_blocks" USING GIN ("payload");

-- CreateIndex
CREATE UNIQUE INDEX "cms_page_blocks_page_id_position_key" ON "cms_page_blocks" ("page_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_full_path_key" ON "cms_pages" ("full_path");

-- CreateIndex
CREATE INDEX "cms_pages_parent_sort_idx" ON "cms_pages" ("parent_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "cms_redirects_from_path_key" ON "cms_redirects" ("from_path");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_photos_year_position_key" ON "gallery_photos" ("year", "position");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_videos_position_key" ON "gallery_videos" ("position");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_section_position_key" ON "menu_items" ("section", "position");

-- CreateIndex
CREATE UNIQUE INDEX "page_blocks_page_position_idx" ON "page_blocks" ("page_id", "position")
WHERE
	(page_id IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "page_blocks_tab_position_idx" ON "page_blocks" ("tab_id", "position")
WHERE
	(tab_id IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "page_paragraphs_block_id_position_key" ON "page_paragraphs" ("block_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "page_tabs_page_id_position_key" ON "page_tabs" ("page_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages" ("slug");

-- CreateIndex
CREATE UNIQUE INDEX "rectors_position_idx" ON "rectors" ("position");

-- CreateIndex
CREATE INDEX "idx_teachers_section" ON "teachers" ("section");

-- AddForeignKey
ALTER TABLE "cms_entities"
ADD CONSTRAINT "cms_entities_detail_page_id_fkey" FOREIGN KEY ("detail_page_id") REFERENCES "cms_pages" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cms_page_blocks"
ADD CONSTRAINT "cms_page_blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "cms_pages" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cms_pages"
ADD CONSTRAINT "cms_pages_legacy_page_id_fkey" FOREIGN KEY ("legacy_page_id") REFERENCES "pages" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cms_pages"
ADD CONSTRAINT "cms_pages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cms_pages" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "page_blocks"
ADD CONSTRAINT "page_blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "page_blocks"
ADD CONSTRAINT "page_blocks_tab_id_fkey" FOREIGN KEY ("tab_id") REFERENCES "page_tabs" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "page_paragraphs"
ADD CONSTRAINT "page_paragraphs_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "page_blocks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "page_tabs"
ADD CONSTRAINT "page_tabs_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
