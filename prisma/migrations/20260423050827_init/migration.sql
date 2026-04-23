-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content_hash" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paid_status" (
    "session_id" UUID NOT NULL,
    "player_id" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paid_status_pkey" PRIMARY KEY ("session_id","player_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_content_hash_key" ON "sessions"("content_hash");

-- CreateIndex
CREATE INDEX "idx_sessions_content_hash" ON "sessions"("content_hash");

-- CreateIndex
CREATE INDEX "idx_paid_status_session" ON "paid_status"("session_id");

-- AddForeignKey
ALTER TABLE "paid_status" ADD CONSTRAINT "paid_status_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
