/*
  Warnings:

  - You are about to drop the column `odds_type` on the `game_odds` table. All the data in the column will be lost.
  - You are about to drop the column `odds_value` on the `game_odds` table. All the data in the column will be lost.
  - Added the required column `odds` to the `game_odds` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "challenge"."game_odds" DROP COLUMN "odds_type",
DROP COLUMN "odds_value",
ADD COLUMN     "odds" JSON NOT NULL;
