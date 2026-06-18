-- EkoFare Option A (pure graph) — initial schema.
-- pg_trgm is enabled first so the trigram GIN index on Stop.name_normalized
-- (added at the end) can use gin_trgm_ops for fuzzy stop resolution (spec §5.1).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "Vehicle" AS ENUM ('DANFO', 'BRT', 'KEKE', 'OKADA', 'FERRY', 'RIDESHARE');

-- CreateEnum
CREATE TYPE "ConnStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'MAJOR');

-- CreateTable
CREATE TABLE "Stop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "from_stop_id" TEXT NOT NULL,
    "to_stop_id" TEXT NOT NULL,
    "vehicle" "Vehicle" NOT NULL,
    "median_fare" INTEGER NOT NULL,
    "fare_reports" INTEGER NOT NULL DEFAULT 0,
    "status" "ConnStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "avg_duration_min" INTEGER,
    "last_verified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FareReport" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "fare" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "is_outlier" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FareReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicle" "Vehicle" NOT NULL,
    "path" TEXT[],
    "total_fare" INTEGER NOT NULL,
    "total_duration" INTEGER,
    "min_verification" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopAlias" (
    "id" TEXT NOT NULL,
    "alias_norm" TEXT NOT NULL,
    "canonical_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StopAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbuseFlag" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT,
    "report_id" TEXT,
    "reason" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbuseFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stop_name_normalized_key" ON "Stop"("name_normalized");

-- CreateIndex
CREATE INDEX "Stop_name_normalized_idx" ON "Stop"("name_normalized");

-- CreateIndex
CREATE INDEX "Connection_from_stop_id_vehicle_idx" ON "Connection"("from_stop_id", "vehicle");

-- CreateIndex
CREATE INDEX "Connection_to_stop_id_vehicle_idx" ON "Connection"("to_stop_id", "vehicle");

-- CreateIndex
CREATE INDEX "Connection_vehicle_fare_reports_idx" ON "Connection"("vehicle", "fare_reports");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_from_stop_id_to_stop_id_vehicle_key" ON "Connection"("from_stop_id", "to_stop_id", "vehicle");

-- CreateIndex
CREATE INDEX "FareReport_connection_id_created_at_idx" ON "FareReport"("connection_id", "created_at");

-- CreateIndex
CREATE INDEX "FareReport_fingerprint_created_at_idx" ON "FareReport"("fingerprint", "created_at");

-- CreateIndex
CREATE INDEX "FeaturedRoute_vehicle_is_active_min_verification_idx" ON "FeaturedRoute"("vehicle", "is_active", "min_verification");

-- CreateIndex
CREATE UNIQUE INDEX "StopAlias_alias_norm_key" ON "StopAlias"("alias_norm");

-- CreateIndex
CREATE INDEX "AbuseFlag_status_created_at_idx" ON "AbuseFlag"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_from_stop_id_fkey" FOREIGN KEY ("from_stop_id") REFERENCES "Stop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_to_stop_id_fkey" FOREIGN KEY ("to_stop_id") REFERENCES "Stop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FareReport" ADD CONSTRAINT "FareReport_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigram GIN index for fuzzy stop-name resolution (spec §5.1: similarity()).
CREATE INDEX "Stop_name_normalized_trgm_idx" ON "Stop" USING GIN ("name_normalized" gin_trgm_ops);
