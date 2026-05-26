-- Canonical schema migration (1:1 with target Drizzle schema)
-- Destructive: drops legacy tables

DROP TABLE IF EXISTS "page_paragraphs" CASCADE;
DROP TABLE IF EXISTS "page_blocks" CASCADE;
DROP TABLE IF EXISTS "page_tabs" CASCADE;
DROP TABLE IF EXISTS "cms_page_blocks" CASCADE;
DROP TABLE IF EXISTS "cms_entities" CASCADE;
DROP TABLE IF EXISTS "cms_pages" CASCADE;
DROP TABLE IF EXISTS "cms_redirects" CASCADE;
DROP TABLE IF EXISTS "gallery_photos" CASCADE;
DROP TABLE IF EXISTS "gallery_videos" CASCADE;
DROP TABLE IF EXISTS "rectors" CASCADE;
DROP TABLE IF EXISTS "teachers" CASCADE;

DROP TABLE IF EXISTS "pages" CASCADE;

CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pages" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme_key" TEXT NOT NULL DEFAULT 'default',
    "sidebar_enabled" BOOLEAN NOT NULL DEFAULT false,
    "draft_document" JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
    "published_document" JSONB,
    "document_version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

CREATE TABLE "page_versions" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_redirects" (
    "id" SERIAL NOT NULL,
    "from_slug" TEXT NOT NULL,
    "to_slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_redirects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "page_redirects_from_slug_key" ON "page_redirects"("from_slug");

CREATE TABLE "people" (
    "id" SERIAL NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "patronymic" TEXT,
    "subtitle" TEXT,
    "year_from" INTEGER NOT NULL,
    "year_to" INTEGER,
    "short_description" TEXT,
    "full_description" TEXT,
    "img" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

CREATE TABLE "person_roles" (
    "person_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    CONSTRAINT "person_roles_pkey" PRIMARY KEY ("person_id","role_id")
);

CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

CREATE TABLE "person_tags" (
    "person_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    CONSTRAINT "person_tags_pkey" PRIMARY KEY ("person_id","tag_id")
);

CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

CREATE TABLE "person_categories" (
    "person_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    CONSTRAINT "person_categories_pkey" PRIMARY KEY ("person_id","category_id")
);

CREATE TABLE "media_folders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_assets" (
    "id" SERIAL NOT NULL,
    "src" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "title" TEXT,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "folder_id" INTEGER,
    "metadata" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "person_media" (
    "person_id" INTEGER NOT NULL,
    "media_asset_id" INTEGER NOT NULL,
    CONSTRAINT "person_media_pkey" PRIMARY KEY ("person_id","media_asset_id")
);

CREATE TABLE "person_documents" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "media_asset_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "person_documents_pkey" PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "menu_items" CASCADE;

CREATE TABLE "menu_items" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "section" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "menu_items_path_key" ON "menu_items"("path");

ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_tags" ADD CONSTRAINT "person_tags_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_tags" ADD CONSTRAINT "person_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_categories" ADD CONSTRAINT "person_categories_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_categories" ADD CONSTRAINT "person_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "person_media" ADD CONSTRAINT "person_media_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_media" ADD CONSTRAINT "person_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_documents" ADD CONSTRAINT "person_documents_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_documents" ADD CONSTRAINT "person_documents_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "roles" ("slug", "label") VALUES
  ('rector', 'Ректоры'),
  ('teacher-vov', 'Купаловцы помнят — ВОВ'),
  ('teacher-afgan', 'Купаловцы помнят — Афганистан'),
  ('olympic-coach', 'Зал славы — тренеры'),
  ('olympic-student', 'Зал славы — студенты'),
  ('trainer', 'Тренеры')
ON CONFLICT ("slug") DO NOTHING;
