-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postLink" TEXT NOT NULL,
    "added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "posts_postId_key" ON "public"."posts"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "posts_postLink_key" ON "public"."posts"("postLink");
