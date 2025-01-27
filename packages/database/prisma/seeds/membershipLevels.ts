import prismaClient, { Prisma } from '../../index'

const { Status } = Prisma
const { membershipLevels } = prismaClient

// membership levels list
export const membershipLevelsList = [
  {
    levelId: 0,
    levelName: 'Novice',
    description: 'Novice',
    eligibilityThreshold: {
      gte: 0,
      lt: 20000,
    },
    feeDeductionPct: 0,
    referralBonusPct: 0.1,
    status: Status.Active,
  },
  {
    levelId: 1,
    levelName: 'Rookie',
    description: 'Rookie',
    eligibilityThreshold: {
      gte: 20000,
      lt: 50000,
    },
    feeDeductionPct: 0,
    referralBonusPct: 0.1,
    status: Status.Active,
  },
  {
    levelId: 2,
    levelName: 'Veteran',
    description: 'Veteran',
    eligibilityThreshold: {
      gte: 50000,
      lt: 100000,
    },
    feeDeductionPct: 0.05,
    referralBonusPct: 0.125,
    status: Status.Active,
  },
  {
    levelId: 3,
    levelName: 'Elite',
    description: 'Elite',
    eligibilityThreshold: {
      gte: 100000,
      lt: 250000,
    },
    feeDeductionPct: 0.1,
    referralBonusPct: 0.15,
    status: Status.Active,
  },
  {
    levelId: 4,
    levelName: 'Pro',
    description: 'Pro',
    eligibilityThreshold: {
      gte: 250000,
      lt: 700000,
    },
    feeDeductionPct: 0.15,
    referralBonusPct: 0.2,
    status: Status.Active,
  },
  {
    levelId: 5,
    levelName: 'Master',
    description: 'Master',
    eligibilityThreshold: {
      gte: 700000,
      lt: 1000000,
    },
    feeDeductionPct: 0.2,
    referralBonusPct: 0.25,
    status: Status.Active,
  },
  {
    levelId: 6,
    levelName: 'Legendary',
    description: 'Legendary',
    eligibilityThreshold: {
      gte: 1000000,
      lt: null,
    },
    feeDeductionPct: 0.25,
    referralBonusPct: 0.3,
    status: Status.Active,
  },
]

const seedMembershipLevels = async (): Promise<void> => {
  for (const membershipLevel of membershipLevelsList) {
    await membershipLevels.upsert({
      where: {
        levelId: membershipLevel.levelId,
      },
      create: membershipLevel,
      update: membershipLevel,
    })
  }
}

export default seedMembershipLevels
