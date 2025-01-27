import prismaClient, { BlockchainNetworks, Prisma } from '@duelnow/database'
import { ContractType, membershipToken } from '@duelnow/utils'
const { membershipLevels, users, contracts, scTransactions } = prismaClient
const { Status } = Prisma
import { isPlainObject } from 'lodash'

export const createScTransactions = async (contractId: number, rawData: unknown): Promise<void> => {
  if (isPlainObject(rawData) && rawData !== null && rawData !== undefined) {
    await scTransactions.create({
      data: {
        contractId,
        rawData,
      },
    })
  } else {
    throw new Error('createScTransactions: rawData must be a JSON-compatible object')
  }
}

export const fetchContract = async (
  contractType: ContractType,
  network: BlockchainNetworks,
): Promise<Record<string, unknown> | null> => {
  switch (contractType) {
    case ContractType.DuelNowToken: {
      return await contracts.findFirst({
        where: {
          tokenName: membershipToken,
          status: Status.Active,
          networks: {
            name: network,
          },
        },
        include: {
          networks: true,
        },
      })
    }

    case ContractType.SportsV1_0_0: {
      // TODO: find sports smart contract in this case. This will be done as part of https://app.clickup.com/t/9014063843/PRD-954
      return null
      break
    }

    default: {
      return null
    }
  }
}

export const findUserByWallet = async (walletAddress: string): Promise<Prisma.Users | null> => {
  return await users.findFirst({
    where: {
      walletAddress,
    },
  })
}

export const getEligibleMembershipLevel = async (balance: string): Promise<Prisma.membershipLevels | null> => {
  return await membershipLevels.findFirst({
    where: {
      AND: [
        {
          eligibilityThreshold: {
            path: ['gte'],
            lte: Number(balance),
          },
        },
        {
          eligibilityThreshold: {
            path: ['lt'],
            gte: Number(balance),
          },
        },
      ],
    },
  })
}
