-- CreateTable
CREATE TABLE "user"."membership_levels" (
    "level_id" INTEGER NOT NULL,
    "level_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility_threshold" JSONB NOT NULL,
    "fee_deduction_pct" DECIMAL(65,30) NOT NULL,
    "referral_bonus_pct" DECIMAL(65,30) NOT NULL,
    "status" "sport"."Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_levels_pkey" PRIMARY KEY ("level_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_levels_level_id_key" ON "user"."membership_levels"("level_id");
