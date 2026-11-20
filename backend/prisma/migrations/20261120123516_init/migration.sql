-- CreateEnum
CREATE TYPE "catalog_item_type" AS ENUM ('service', 'addon', 'product');

-- CreateEnum
CREATE TYPE "order_source" AS ENUM ('public', 'admin_manual', 'admin_ai_chat');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('treatment', 'product_only');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending_confirmation', 'received', 'processing', 'done', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "fulfillment" AS ENUM ('pickup', 'dropoff');

-- CreateEnum
CREATE TYPE "service_area" AS ENUM ('sidoarjo', 'surabaya');

-- CreateEnum
CREATE TYPE "scheduled_slot" AS ENUM ('morning', 'noon', 'evening');

-- CreateEnum
CREATE TYPE "estimate_source" AS ENUM ('ai', 'manual', 'baseline');

-- CreateEnum
CREATE TYPE "photo_kind" AS ENUM ('before_customer', 'before', 'after');

-- CreateEnum
CREATE TYPE "photo_uploader" AS ENUM ('customer', 'admin');

-- CreateTable
CREATE TABLE "catalog_items" (
    "code" TEXT NOT NULL,
    "type" "catalog_item_type" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_idr" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "est_days_hint" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone_e164" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" CHAR(11) NOT NULL,
    "customer_id" UUID NOT NULL,
    "source" "order_source" NOT NULL,
    "order_type" "order_type" NOT NULL,
    "status" "order_status" NOT NULL,
    "customer_name_snapshot" TEXT NOT NULL,
    "fulfillment" "fulfillment" NOT NULL,
    "area" "service_area",
    "scheduled_date" DATE NOT NULL,
    "scheduled_slot" "scheduled_slot" NOT NULL,
    "address_text" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "customer_notes" TEXT,
    "internal_notes" TEXT,
    "subtotal_idr" INTEGER NOT NULL,
    "shipping_idr" INTEGER NOT NULL,
    "total_idr" INTEGER NOT NULL,
    "estimated_days" INTEGER,
    "ai_estimate_days" INTEGER,
    "estimate_source" "estimate_source",
    "received_at" TIMESTAMPTZ(3),
    "done_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "cancel_reason" TEXT,
    "idempotency_key" TEXT,
    "client_ip_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "item_type" "catalog_item_type" NOT NULL,
    "catalog_code" TEXT NOT NULL,
    "name_snapshot" TEXT NOT NULL,
    "unit_price_snapshot" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "line_total" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "kind" "photo_kind" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by" "photo_uploader" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_blobs" (
    "photo_id" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_blobs_pkey" PRIMARY KEY ("photo_id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "from_status" "order_status",
    "to_status" "order_status" NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aftercare_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "copied_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "aftercare_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_e164_key" ON "customers"("phone_e164");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_photos_order_id_idx" ON "order_photos"("order_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

-- CreateIndex
CREATE INDEX "aftercare_messages_order_id_idx" ON "aftercare_messages"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_catalog_code_fkey" FOREIGN KEY ("catalog_code") REFERENCES "catalog_items"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_photos" ADD CONSTRAINT "order_photos_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_blobs" ADD CONSTRAINT "photo_blobs_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "order_photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aftercare_messages" ADD CONSTRAINT "aftercare_messages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
