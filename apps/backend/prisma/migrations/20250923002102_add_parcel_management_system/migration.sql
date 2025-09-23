-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."SpaceTheme" AS ENUM ('MODERN', 'CLASSIC', 'MINIMALIST', 'DARK', 'COLORFUL', 'NATURE');

-- CreateEnum
CREATE TYPE "public"."RoomType" AS ENUM ('MEETING', 'FOCUS', 'SOCIAL', 'LOUNGE', 'WORKSPACE', 'PRESENTATION', 'BRAINSTORM', 'PHONE_BOOTH');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('ACTIVE', 'IDLE', 'AWAY', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."AchievementType" AS ENUM ('FIRST_LOGIN', 'DAILY_STREAK_3', 'DAILY_STREAK_7', 'DAILY_STREAK_30', 'MEETING_MASTER', 'SOCIAL_BUTTERFLY', 'FOCUS_CHAMPION', 'EARLY_BIRD', 'NIGHT_OWL', 'ROOM_CREATOR', 'SPACE_EXPLORER', 'MESSAGE_SENDER', 'COLLABORATION_STAR');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'EMOJI_REACTION', 'VOICE_NOTE', 'SCREEN_SHARE', 'POLL', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "public"."ParcelType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE', 'PUBLIC_PARK', 'INFRASTRUCTURE', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."ParcelStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OWNED', 'UNDER_CONSTRUCTION', 'DEVELOPED', 'ABANDONED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "public"."BuildingType" AS ENUM ('HOUSE', 'APARTMENT', 'OFFICE', 'SHOP', 'RESTAURANT', 'WAREHOUSE', 'FACTORY', 'SCHOOL', 'HOSPITAL', 'PARK', 'PLAZA', 'PARKING', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "organization_id" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMP(3),
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "plan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "plan_expires_at" TIMESTAMP(3),
    "settings" JSONB,
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "max_spaces" INTEGER NOT NULL DEFAULT 3,
    "max_storage" INTEGER NOT NULL DEFAULT 1024,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL,
    "background_url" TEXT,
    "theme" "public"."SpaceTheme" NOT NULL DEFAULT 'MODERN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "max_users" INTEGER NOT NULL DEFAULT 50,
    "require_invite" BOOLEAN NOT NULL DEFAULT false,
    "creator_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."RoomType" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 8,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "allow_guests" BOOLEAN NOT NULL DEFAULT true,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION DEFAULT 0,
    "color" TEXT DEFAULT '#3B82F6',
    "icon" TEXT,
    "config" JSONB,
    "space_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."space_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "space_id" TEXT,
    "room_id" TEXT,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "duration" INTEGER,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."AchievementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "badge_url" TEXT,
    "metadata" JSONB,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "sender_id" TEXT NOT NULL,
    "room_id" TEXT,
    "target_user_id" TEXT,
    "metadata" JSONB,
    "attachments" JSONB,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" TEXT,
    "reactions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parcels" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "parcelType" "public"."ParcelType" NOT NULL,
    "status" "public"."ParcelStatus" NOT NULL DEFAULT 'AVAILABLE',
    "buildingType" "public"."BuildingType",
    "basePrice" DOUBLE PRECISION,
    "currentPrice" DOUBLE PRECISION,
    "monthlyTax" DOUBLE PRECISION DEFAULT 0,
    "owner_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "mapConfig" TEXT,
    "preset" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "public"."users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_clerk_id_idx" ON "public"."users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "public"."users"("organization_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "public"."organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "public"."organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_owner_id_idx" ON "public"."organizations"("owner_id");

-- CreateIndex
CREATE INDEX "spaces_organization_id_idx" ON "public"."spaces"("organization_id");

-- CreateIndex
CREATE INDEX "spaces_creator_id_idx" ON "public"."spaces"("creator_id");

-- CreateIndex
CREATE INDEX "spaces_is_public_idx" ON "public"."spaces"("is_public");

-- CreateIndex
CREATE INDEX "rooms_space_id_idx" ON "public"."rooms"("space_id");

-- CreateIndex
CREATE INDEX "rooms_type_idx" ON "public"."rooms"("type");

-- CreateIndex
CREATE UNIQUE INDEX "space_invites_token_key" ON "public"."space_invites"("token");

-- CreateIndex
CREATE INDEX "space_invites_token_idx" ON "public"."space_invites"("token");

-- CreateIndex
CREATE INDEX "space_invites_space_id_idx" ON "public"."space_invites"("space_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "public"."sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_space_id_idx" ON "public"."sessions"("space_id");

-- CreateIndex
CREATE INDEX "sessions_room_id_idx" ON "public"."sessions"("room_id");

-- CreateIndex
CREATE INDEX "sessions_started_at_idx" ON "public"."sessions"("started_at");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "public"."sessions"("status");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "public"."user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "user_achievements_type_idx" ON "public"."user_achievements"("type");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_type_key" ON "public"."user_achievements"("user_id", "type");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "public"."messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_room_id_idx" ON "public"."messages"("room_id");

-- CreateIndex
CREATE INDEX "messages_target_user_id_idx" ON "public"."messages"("target_user_id");

-- CreateIndex
CREATE INDEX "messages_parent_id_idx" ON "public"."messages"("parent_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "public"."messages"("created_at");

-- CreateIndex
CREATE INDEX "parcels_owner_id_idx" ON "public"."parcels"("owner_id");

-- CreateIndex
CREATE INDEX "parcels_organization_id_idx" ON "public"."parcels"("organization_id");

-- CreateIndex
CREATE INDEX "parcels_space_id_idx" ON "public"."parcels"("space_id");

-- CreateIndex
CREATE INDEX "parcels_status_idx" ON "public"."parcels"("status");

-- CreateIndex
CREATE INDEX "parcels_parcelType_idx" ON "public"."parcels"("parcelType");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_organization_id_space_id_number_key" ON "public"."parcels"("organization_id", "space_id", "number");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rooms" ADD CONSTRAINT "rooms_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."space_invites" ADD CONSTRAINT "space_invites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcels" ADD CONSTRAINT "parcels_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcels" ADD CONSTRAINT "parcels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parcels" ADD CONSTRAINT "parcels_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
