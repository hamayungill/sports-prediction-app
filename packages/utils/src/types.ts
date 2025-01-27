/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Prisma } from '@duelnow/database'

export interface CreateChallenge {
  creatorAccountId: string
  challengeMode: Prisma.ChallengeMode
  challengeType: Prisma.ChallengeType
  oddsFlag: boolean
  challengeValueQty: number
  participantOutcome: Prisma.Outcome
  participantOdds: number
  paidWalletAddress: string
  transactionHash: string
  exchangeRate: number
  gameType: Prisma.CategoryDepth
  pickem?: string
  sportId: number
  leagueName: string
  homeAbbreviation?: string
  awayAbbreviation?: string
  winCriteria?: number
  gameId: number
  playerId?: string
  teamId?: string
  categoryId?: number
  groupId?: number
  subgroupId?: number
  participantStatP1?: number
  participantStatP2?: number
  statAttribute?: string
  startDate: string
  endDate: string
  multiTokenFlag: boolean
  contractId: number
  scContractId: number
  participantRole: Prisma.ParticipantRole
  participantInputQty?: number
  pickemScoreMode?: Prisma.PickemScoreMode
}

export interface GetParams {
  filter?: Record<string, any>
  sort?: object
  skip?: number
  take?: number
}

export interface IKafkaMessageValue {
  eventName: string
  data: Record<string, any>
}

export interface InsertCDFData {
  challengeId: number
  scChallengeId: string
  contractId: number
  event: Prisma.CdfEvent
  finalOutcome?: Prisma.Outcome
  status: Prisma.TxnStatus
}

export interface JoinChallenge {
  participantAccountId: string
  paidWalletAddress: string
  oddsFlag: boolean
  multiTokenFlag: boolean
  participantOutcome: Prisma.Outcome
  participantOdds: number
  participationValueQty: number
  scChallengeId: string
  transactionHash: string
  challengeValueQty: number
  participationValueUsd: number
  exchangeRate: number
  challengeMode: Prisma.ChallengeMode
  gameType: Prisma.CategoryDepth
  contractId: number
  categoryId?: number
  groupId?: number
  subgroupId?: number
  challengeGroupId: number
  participantStatP1?: number
  participantStatP2?: number
  statAttribute?: string
  participantRole: Prisma.ParticipantRole
  participantInputQty?: number
}

export interface JoinChallengeForm {
  scChallengeId: string
  challengeId: number
  walletAddress: string
  contractId: number
  participantOdds: number
  participantAccountId: string
  oddsFlag: boolean
  multiTokenFlag: boolean
  participationValueQty: number
  participationValueUsd: number
  challengeDepth: Prisma.CategoryDepth
  challengeGroupId: number
  exchangeRate: number
  participantOutcome: Prisma.Outcome
  status: Prisma.ChallengeStatus
  categoryId?: number
  groupId?: number
  subgroupId?: number
  participantStatP1?: number
  participantStatP2?: number
  statAttribute?: string
  isReady?: boolean
  participantRole: Prisma.ParticipantRole
  challengeMode: Prisma.ChallengeMode
}

export interface PatchUserBody {
  firstName?: string
  lastName?: string
  nickname?: string
  email?: string
  uid?: string
  handle?: string
}

export interface PatchUserTouAndNotif {
  terms?: Record<string, boolean>
}

export interface PriceResult {
  token: string
  usdPrice: number
}

export interface PrismaParams {
  where?: any
  select?: any
  orderBy?: any
  skip?: number
  take?: number
  include?: any
}

export interface SmartContractResponse {
  challengeId: number
  scChallengeId: string
  walletAddress: string
  isScFailed: boolean
  isJoin: boolean
  isReadyState: boolean
  exchangeRate: number
  challengeValueQty: number
  participationValueQty: number
  transactionHash: string
}

export interface UpdateChallengeMode {
  challengeMode: Prisma.ChallengeMode
  shareStatus: Prisma.ShareStatus
  creatorStakedQty?: number
}

export interface UpdateChallengeType {
  challengeId: number
  challengeType: Prisma.ChallengeType
}

export interface UpdateTiebreaker {
  challengeResultId: number
  tiebreaker: number
}

export interface UpsertFavorites {
  challengeId: number
  isFavorite: boolean
}

export interface UpsertLineups {
  sportId: number
  lineupId?: number
  challengeId: number
  challengeResultId: number
  pickTeamId?: string
  spreadPoints: number
  gameId: number
  pickStatus: Prisma.Status
}

export interface UpstakeTokenQty {
  challengeId: number
  scChallengeId: string
  walletAddress: string
  contractId: number
  tokenUpstakeQty: number
}

export interface UserPreference {
  preferenceId: number
  preferenceValue: string
}
