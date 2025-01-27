-- CreateEnum
CREATE TYPE "challenge"."ParticipantRole" AS ENUM ('Creator', 'Participant', 'Initiator', 'Initializer');

-- AlterTable
ALTER TABLE "challenge"."challenge_participations" ADD COLUMN     "participant_role" "challenge"."ParticipantRole" NOT NULL DEFAULT 'Participant';
