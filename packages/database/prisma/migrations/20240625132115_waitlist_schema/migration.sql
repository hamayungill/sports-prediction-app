-- CreateTable
CREATE TABLE "user"."waitlist" (
    "waitlistId" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "is_applied" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("waitlistId")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_waitlistId_key" ON "user"."waitlist"("waitlistId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "user"."waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_invite_code_key" ON "user"."waitlist"("invite_code");

-- CreateIndex
CREATE INDEX "waitlist_email_idx" ON "user"."waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_invite_code_idx" ON "user"."waitlist"("invite_code");
