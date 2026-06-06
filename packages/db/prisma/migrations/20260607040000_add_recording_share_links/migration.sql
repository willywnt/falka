-- CreateTable
CREATE TABLE "recording_share_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recording_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recording_share_links_tokenHash_key" ON "recording_share_links"("tokenHash");

-- CreateIndex
CREATE INDEX "recording_share_links_recordingId_idx" ON "recording_share_links"("recordingId");

-- CreateIndex
CREATE INDEX "recording_share_links_userId_idx" ON "recording_share_links"("userId");

-- AddForeignKey
ALTER TABLE "recording_share_links" ADD CONSTRAINT "recording_share_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recording_share_links" ADD CONSTRAINT "recording_share_links_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
