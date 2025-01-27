// eslint-disable-next-line import/no-extraneous-dependencies
import prismaClient, { BlockchainNetworks } from '@duelnow/database'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import * as dotenvExtended from 'dotenv-extended'

import { fetchWithHeaders } from './utils/helper'
import { logger } from './utils/logger'
import {
  cancelChallenge,
  cancelParticipation,
  checkUserTokenBalance,
  createMerkleTree,
  generateProof,
  getChallengeDetails,
  getCurrentBlockNumber,
  getSubscriber,
  resolveChallenge,
  resolveGroupChallenge,
  updateMerkleRoot,
} from './web3'

const abi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'backend_',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'AdminReceived',
    type: 'event',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'token',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'AdminWithdrawn',
    type: 'event',
    inputs: [
      {
        name: 'token',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'CancelParticipation',
    type: 'event',
    inputs: [
      {
        name: 'user',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'challengeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ChallengeCanceled',
    type: 'event',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ChallengeCreated',
    type: 'event',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'token',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'by',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ChallengeFundsMoved',
    type: 'event',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'winners',
        type: 'address[]',
        indexed: false,
        internalType: 'address[]',
      },
      {
        name: 'winnersProfit',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
      {
        name: 'losers',
        type: 'address[]',
        indexed: false,
        internalType: 'address[]',
      },
      {
        name: 'losersLoss',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ChallengeJoined',
    type: 'event',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'by',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ChallengeResolved',
    type: 'event',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'finalOutcome',
        type: 'uint8',
        indexed: false,
        internalType: 'uint8',
      },
    ],
    anonymous: false,
  },
  {
    name: 'OwnershipTransferred',
    type: 'event',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    name: 'UserWithdrawn',
    type: 'event',
    inputs: [
      {
        name: 'token',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'by',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    name: 'allowBetting',
    type: 'function',
    inputs: [
      {
        name: 'value_',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowTokens',
    type: 'function',
    inputs: [
      {
        name: 'tokens',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'priceFeeds',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'minBetAmounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'applyMembershipValues',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'awaitingTimeForPublicCancel',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'backend',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'bettingAllowed',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'cancelChallenge',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'cancelType',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'cancelParticipation',
    type: 'function',
    inputs: [
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'challengeExists',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'changeBackend',
    type: 'function',
    inputs: [
      {
        name: 'backend_',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'changeChallengeTime',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'startTime',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'endTime',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'changeMinUSDBettingAmount',
    type: 'function',
    inputs: [
      {
        name: 'value_',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'createChallenge',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountFromWallet',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountFromWithdrawables',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'decision',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'challengeType',
        type: 'uint8',
        internalType: 'enum IP2PSports.ChallengeType',
      },
      {
        name: 'startTime',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'endTime',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'membershipLevel',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'feePercentage',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'referrer',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'referralCommision',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'proof',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'debitInSC',
    type: 'function',
    inputs: [
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_token',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'defaultOracleDecimals',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getAdminShareRules',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'thresholds',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'percentages',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getAllowedTokens',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getChallengeDetails',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'challengeDetails',
        type: 'tuple',
        components: [
          {
            name: 'token',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'usersFor',
            type: 'address[]',
            internalType: 'address[]',
          },
          {
            name: 'usersAgainst',
            type: 'address[]',
            internalType: 'address[]',
          },
          {
            name: 'amountFor',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountAgainst',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'status',
            type: 'uint8',
            internalType: 'enum IP2PSports.ChallengeStatus',
          },
          {
            name: 'challengeType',
            type: 'uint8',
            internalType: 'enum IP2PSports.ChallengeType',
          },
          {
            name: 'startTime',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'endTime',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        internalType: 'struct IP2PSports.Challenge',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getUserBet',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          {
            name: 'amount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'decision',
            type: 'uint8',
            internalType: 'uint8',
          },
          {
            name: 'adminShare',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        internalType: 'struct IP2PSports.UserBet',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getUserWithdrawables',
    type: 'function',
    inputs: [
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'tokens',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'increaseBetAmount',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountFromWallet',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountFromWithdrawables',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'membershipLevel',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'feePercentage',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'referrer',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'referralCommision',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'proof',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'joinChallenge',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountFromWallet',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountFromWithdrawables',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'decision',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'membershipLevel',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'feePercentage',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'referrer',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'referralCommision',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'proof',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'latestChallengeId',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'maxAdminSharePercentage',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'maxChallengersEachSide',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'maxChallengersForPickem',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'maxChallengesToResolve',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'maxWinnersGroupChallenge',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'minUSDBetAmount',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'owner',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'renounceOwnership',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'resolveChallenge',
    type: 'function',
    inputs: [
      {
        name: 'challengeIds',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'finalOutcomes',
        type: 'uint8[]',
        internalType: 'uint8[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'resolveGroupChallenge',
    type: 'function',
    inputs: [
      {
        name: 'challengeId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'winners',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'profits',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'restrictTokens',
    type: 'function',
    inputs: [
      {
        name: 'tokens',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'setAdminShareRules',
    type: 'function',
    inputs: [
      {
        name: 'thresholds',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'percentages',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'transferOwnership',
    type: 'function',
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateApplyMembershipValues',
    type: 'function',
    inputs: [
      {
        name: 'value_',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateMaxChallengers',
    type: 'function',
    inputs: [
      {
        name: '_maxChallengersEachSide',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_maxChallengersForPickem',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateRoot',
    type: 'function',
    inputs: [
      {
        name: '_root',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'receive',
    stateMutability: 'payable',
  },
]

let resolved = 1

// Mocking fetch globally
global.fetch = jest.fn().mockResolvedValue({ ok: 1, json: jest.fn() })

jest.mock('@duelnow/kafka-client', () => ({
  sendAlert: jest.fn(),
}))

jest.mock('@duelnow/redis', (): object => ({
  getRedisKey: jest.fn(),
  setRedisKey: jest.fn(),
}))

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {
      challenges: {
        findFirst: jest.fn(),
      },
      scTransactions: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      contracts: {
        findFirst: jest.fn(),
      },
      users: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      membershipLevels: {
        findFirst: jest.fn(),
      },
    },
    Prisma: {
      ...actualPrisma.Prisma,
    },
    BlockchainNetworks: actualPrisma.BlockchainNetworks,
  }
})

jest.mock('@duelnow/rates', () => ({
  getRates: jest.fn().mockResolvedValue([{ usdPrice: 1 }]),
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

jest.mock('./utils/envs', () => {
  const actualUtils = jest.requireActual('./utils/envs')
  return {
    scAdminPrivateKey: actualUtils.privateKeyToAccount,
    infuraJwtKeyId: actualUtils.infuraJwtKeyId,
    infuraJwtPrivateKey: actualUtils.infuraJwtPrivateKey,
    ethereumWebSocketUrl: actualUtils.ethereumWebSocketUrl,
    ethereumApiUrl: actualUtils.ethereumApiUrl,
    arbitrumApiUrl: actualUtils.arbitrumApiUrl,
    arbitrumWebSocketUrl: actualUtils.arbitrumWebSocketUrl,
  }
})

jest.mock('@duelnow/utils', () => {
  const actualUtils = jest.requireActual('@duelnow/utils')
  return {
    ZeroAddress: actualUtils.ZeroAddress,
    SCChallengeStatus: actualUtils.SCChallengeStatus,
    EventName: actualUtils.EventName,
    AlertPriority: actualUtils.AlertPriority,
    WORKERS: actualUtils.WORKERS,
    TOPICS: actualUtils.TOPICS,
    delay: jest.fn(),
    isLocal: jest.fn(),
  }
})

jest.mock('@openzeppelin/merkle-tree', () => ({
  StandardMerkleTree: {
    of: jest.fn().mockResolvedValue({
      dump: jest.fn().mockResolvedValue('{}'),
      format: 'standard-v1',
      tree: [
        '0xce4859ac815da091526d7f8e49519a6389c08054773679d5901f47f6215df7a2',
        '0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7',
        '0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6',
        '0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c',
        '0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c',
        '0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b',
        '0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223',
        '0x3ea4e7d1dfe77983c13bba776027501fcd75790fc88fbb372791c92a798394db',
        '0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9',
      ],
      values: [
        {
          value: [
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            1,
            '5000000000000000000',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            '10000000000000000000',
          ],
          treeIndex: 4,
        },
        {
          value: [
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            2,
            '10000000000000000000',
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            '12500000000000000000',
          ],
          treeIndex: 6,
        },
        {
          value: [
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            3,
            '15000000000000000000',
            '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            '15000000000000000000',
          ],
          treeIndex: 7,
        },
        {
          value: [
            '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            4,
            '20000000000000000000',
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '20000000000000000000',
          ],
          treeIndex: 8,
        },
        {
          value: [
            '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
            1,
            '20000000000000000000',
            '0x0000000000000000000000000000000000000000',
            '20000000000000000000',
          ],
          treeIndex: 5,
        },
      ],
      leafEncoding: ['address', 'uint256', 'uint256', 'address', 'uint256'],
    }),
    load: jest.fn().mockResolvedValue({
      tree: [
        {
          '0': 206,
          '1': 72,
          '2': 89,
          '3': 172,
          '4': 129,
          '5': 93,
          '6': 160,
          '7': 145,
          '8': 82,
          '9': 109,
          '10': 127,
          '11': 142,
          '12': 73,
          '13': 81,
          '14': 154,
          '15': 99,
          '16': 137,
          '17': 192,
          '18': 128,
          '19': 84,
          '20': 119,
          '21': 54,
          '22': 121,
          '23': 213,
          '24': 144,
          '25': 31,
          '26': 71,
          '27': 246,
          '28': 33,
          '29': 93,
          '30': 247,
          '31': 162,
        },
        {
          '0': 227,
          '1': 71,
          '2': 82,
          '3': 179,
          '4': 177,
          '5': 189,
          '6': 106,
          '7': 241,
          '8': 254,
          '9': 40,
          '10': 179,
          '11': 122,
          '12': 104,
          '13': 15,
          '14': 239,
          '15': 178,
          '16': 174,
          '17': 161,
          '18': 29,
          '19': 47,
          '20': 25,
          '21': 84,
          '22': 222,
          '23': 190,
          '24': 21,
          '25': 186,
          '26': 105,
          '27': 83,
          '28': 203,
          '29': 89,
          '30': 93,
          '31': 199,
        },
        {
          '0': 44,
          '1': 36,
          '2': 69,
          '3': 231,
          '4': 195,
          '5': 80,
          '6': 157,
          '7': 33,
          '8': 72,
          '9': 149,
          '10': 157,
          '11': 58,
          '12': 140,
          '13': 46,
          '14': 112,
          '15': 35,
          '16': 180,
          '17': 133,
          '18': 140,
          '19': 9,
          '20': 150,
          '21': 23,
          '22': 181,
          '23': 213,
          '24': 92,
          '25': 177,
          '26': 183,
          '27': 174,
          '28': 92,
          '29': 11,
          '30': 224,
          '31': 182,
        },
        {
          '0': 24,
          '1': 159,
          '2': 231,
          '3': 83,
          '4': 180,
          '5': 57,
          '6': 77,
          '7': 197,
          '8': 41,
          '9': 121,
          '10': 92,
          '11': 51,
          '12': 205,
          '13': 179,
          '14': 191,
          '15': 21,
          '16': 92,
          '17': 214,
          '18': 131,
          '19': 178,
          '20': 135,
          '21': 69,
          '22': 36,
          '23': 248,
          '24': 118,
          '25': 185,
          '26': 17,
          '27': 221,
          '28': 1,
          '29': 156,
          '30': 137,
          '31': 124,
        },
        {
          '0': 125,
          '1': 12,
          '2': 243,
          '3': 165,
          '4': 159,
          '5': 135,
          '6': 64,
          '7': 244,
          '8': 39,
          '9': 39,
          '10': 247,
          '11': 243,
          '12': 81,
          '13': 99,
          '14': 181,
          '15': 36,
          '16': 158,
          '17': 23,
          '18': 150,
          '19': 164,
          '20': 135,
          '21': 175,
          '22': 34,
          '23': 215,
          '24': 217,
          '25': 208,
          '26': 11,
          '27': 85,
          '28': 175,
          '29': 86,
          '30': 210,
          '31': 156,
        },
        {
          '0': 84,
          '1': 57,
          '2': 180,
          '3': 3,
          '4': 6,
          '5': 52,
          '6': 158,
          '7': 247,
          '8': 77,
          '9': 165,
          '10': 180,
          '11': 4,
          '12': 86,
          '13': 222,
          '14': 36,
          '15': 184,
          '16': 39,
          '17': 213,
          '18': 113,
          '19': 214,
          '20': 198,
          '21': 185,
          '22': 99,
          '23': 139,
          '24': 91,
          '25': 246,
          '26': 86,
          '27': 27,
          '28': 32,
          '29': 230,
          '30': 25,
          '31': 91,
        },
        {
          '0': 78,
          '1': 35,
          '2': 45,
          '3': 168,
          '4': 96,
          '5': 75,
          '6': 183,
          '7': 41,
          '8': 185,
          '9': 60,
          '10': 102,
          '11': 18,
          '12': 246,
          '13': 203,
          '14': 169,
          '15': 173,
          '16': 45,
          '17': 59,
          '18': 246,
          '19': 172,
          '20': 200,
          '21': 7,
          '22': 236,
          '23': 191,
          '24': 126,
          '25': 52,
          '26': 87,
          '27': 172,
          '28': 86,
          '29': 108,
          '30': 18,
          '31': 35,
        },
        {
          '0': 62,
          '1': 164,
          '2': 231,
          '3': 209,
          '4': 223,
          '5': 231,
          '6': 121,
          '7': 131,
          '8': 193,
          '9': 59,
          '10': 186,
          '11': 119,
          '12': 96,
          '13': 39,
          '14': 80,
          '15': 31,
          '16': 205,
          '17': 117,
          '18': 121,
          '19': 15,
          '20': 200,
          '21': 143,
          '22': 187,
          '23': 55,
          '24': 39,
          '25': 145,
          '26': 201,
          '27': 42,
          '28': 121,
          '29': 131,
          '30': 148,
          '31': 219,
        },
        {
          '0': 19,
          '1': 223,
          '2': 0,
          '3': 89,
          '4': 98,
          '5': 89,
          '6': 27,
          '7': 30,
          '8': 237,
          '9': 147,
          '10': 188,
          '11': 244,
          '12': 156,
          '13': 61,
          '14': 61,
          '15': 247,
          '16': 125,
          '17': 161,
          '18': 28,
          '19': 249,
          '20': 240,
          '21': 166,
          '22': 138,
          '23': 129,
          '24': 57,
          '25': 167,
          '26': 37,
          '27': 57,
          '28': 5,
          '29': 175,
          '30': 75,
          '31': 185,
        },
      ],
      values: [
        {
          value: [
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            1,
            '5000000000000000000',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            '10000000000000000000',
          ],
          treeIndex: 4,
        },
        {
          value: [
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            2,
            '10000000000000000000',
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            '12500000000000000000',
          ],
          treeIndex: 6,
        },
        {
          value: [
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            3,
            '15000000000000000000',
            '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            '15000000000000000000',
          ],
          treeIndex: 7,
        },
        {
          value: [
            '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            4,
            '20000000000000000000',
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '20000000000000000000',
          ],
          treeIndex: 8,
        },
        {
          value: [
            '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
            1,
            '20000000000000000000',
            '0x0000000000000000000000000000000000000000',
            '20000000000000000000',
          ],
          treeIndex: 5,
        },
      ],
      leafEncoding: ['address', 'uint256', 'uint256', 'address', 'uint256'],
      hashLookup: {
        '0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c': 0,
        '0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223': 1,
        '0x3ea4e7d1dfe77983c13bba776027501fcd75790fc88fbb372791c92a798394db': 2,
        '0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9': 3,
        '0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b': 4,
      },
      entries: jest.fn().mockReturnValue([
        [0, ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']],
        [1, ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8']],
      ]),
      getProof: jest.fn().mockReturnValue(['proof1', 'proof2']),
    }),
  },
}))

jest.mock('./utils/helper', () => ({
  FetchHttpProvider: jest.fn(),
  fetchWithHeaders: jest.fn(),
  createJWT: jest.fn(),
}))

jest.mock('web3', () => {
  return jest.fn().mockImplementation(() => {
    return {
      eth: {
        Contract: jest.fn().mockImplementation(() => {
          return {
            getPastEvents: jest.fn().mockResolvedValue([
              {
                address: '0x4b9bd5452a741f991ae25377c18d50e68323a40e',
                blockHash: '0x5c37c4cd64bc18e7711f9fb84d5ba386780e78a12a6387c181d8c47a3efc1450',
                blockNumber: 4559717n,
                data: '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000009184e72a00000000000000000000000000053638975bc11de3029e46df193d64879eaea94eb',
                logIndex: 50n,
                removed: false,
                topics: ['0x8924f23e5e080640a3b9735ff0e2540d18f8521d9735e6838593cb9dd121e76c'],
                transactionHash: '0x415e69477edc7e588d3c6c369e18de543acbbacea4023cf0b6d0b1a825603aed',
                transactionIndex: 21n,
                returnValues: {
                  challengeId: '1',
                  token: '0x0000000000000000000000000000000000000000',
                  by: '0x53638975BC11de3029E46DF193d64879EAeA94eB',
                  winnersProfit: [10000, 1900],
                  winners: ['0x53638975BC11de3029E46DF193d64879EAeA94eB', '0x53638975BC11de3029E46DF193d64879EAeA94eB'],
                  losers: ['0x53638975BC11de3029E46DF193d64879EAeA94eB', '0x53638975BC11de3029E46DF193d64879EAeA94eB'],
                  losersLoss: [10000n, 1900n],
                },
                event: 'ChallengeJoined',
                signature: '0x8924f23e5e080640a3b9735ff0e2540d18f8521d9735e6838593cb9dd121e76c',
                raw: {
                  data: '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000009184e72a00000000000000000000000000053638975bc11de3029e46df193d64879eaea94eb',
                  topics: ['0x8924f23e5e080640a3b9735ff0e2540d18f8521d9735e6838593cb9dd121e76c'],
                },
              },
              {
                address: '0x4b9bd5452a741f991ae25377c18d50e68323a40e',
                blockHash: '0x5c37c4cd64bc18e7711f9fb84d5ba386780e78a12a6387c181d8c47a3efc1450',
                blockNumber: 4559717n,
                data: '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000053638975bc11de3029e46df193d64879eaea94eb',
                logIndex: 49n,
                removed: false,
                topics: ['0xbaa6e4dbec861c736f4ebaa1b7d0d19757de58d21ca7417d3cf2b6e2284794f0'],
                transactionHash: '0x415e69477edc7e588d3c6c369e18de543acbbacea4023cf0b6d0b1a825603aed',
                transactionIndex: 21n,
                returnValues: {
                  challengeId: '1',
                  token: '0x0000000000000000000000000000000000000000',
                  by: '0x53638975BC11de3029E46DF193d64879EAeA94eB',
                  winnersProfit: [10000, 1900],
                  winners: ['0x53638975BC11de3029E46DF193d64879EAeA94eB', '0x53638975BC11de3029E46DF193d64879EAeA94eB'],
                  losers: ['0x53638975BC11de3029E46DF193d64879EAeA94eB', '0x53638975BC11de3029E46DF193d64879EAeA94eB'],
                  losersLoss: [10000n, 1900n],
                },
                event: 'ChallengeCreated',
                signature: '0xbaa6e4dbec861c736f4ebaa1b7d0d19757de58d21ca7417d3cf2b6e2284794f0',
                raw: {
                  data: '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000053638975bc11de3029e46df193d64879eaea94eb',
                  topics: ['0xbaa6e4dbec861c736f4ebaa1b7d0d19757de58d21ca7417d3cf2b6e2284794f0'],
                },
              },
            ]),
            methods: {
              updateRoot: jest.fn().mockImplementation(() => {
                return {
                  encodeABI: jest.fn().mockResolvedValue({}),
                  estimateGas: jest.fn().mockResolvedValue('120000000'),
                  transactionHash: '0xtransactionHash',
                }
              }),
              cancelChallenge: jest.fn().mockImplementation(() => {
                return {
                  encodeABI: jest.fn().mockResolvedValue({}),
                  estimateGas: jest.fn().mockResolvedValue('120000000'),
                  transactionHash: '0xtransactionHash',
                }
              }),
              cancelParticipation: jest.fn().mockImplementation(() => {
                return {
                  encodeABI: jest.fn().mockResolvedValue({}),
                  estimateGas: jest.fn().mockResolvedValue('120000000'),
                  transactionHash: '0xtransactionHash',
                }
              }),
              resolveChallenge: jest.fn().mockImplementation(() => {
                return {
                  encodeABI: jest.fn().mockResolvedValue({}),
                  estimateGas: jest.fn().mockResolvedValue('120000000'),
                  transactionHash: '0xtransactionHash',
                }
              }),
              resolveGroupChallenge: jest.fn().mockImplementation(() => {
                return {
                  encodeABI: jest.fn().mockResolvedValue({}),
                  estimateGas: jest.fn().mockResolvedValue('120000000'),
                  transactionHash: '0xtransactionHash',
                }
              }),
              balanceOf: jest.fn().mockImplementation(() => {
                return {
                  call: jest.fn().mockResolvedValue('120000000'),
                }
              }),
              getChallengeDetails: jest.fn().mockImplementation(() => {
                if (resolved === 5 || resolved === 6) {
                  return {
                    call: jest.fn().mockResolvedValue({
                      status: 4,
                      token: '0x0',
                      usersFor: [],
                      usersAgainst: [],
                      amountFor: 1,
                      amountAgainst: 1,
                      challengeType: 'individual',
                      startTime: '1294823423',
                      endTime: '2134243523',
                    }),
                  }
                }

                if (resolved === 7 || resolved === 8) {
                  return {
                    call: jest.fn().mockResolvedValue({
                      status: 6,
                      token: '0x0',
                      usersFor: [],
                      usersAgainst: [],
                      amountFor: 1,
                      amountAgainst: 1,
                      challengeType: 'individual',
                      startTime: '1294823423',
                      endTime: '2134243523',
                    }),
                  }
                }

                return {
                  call: jest.fn().mockResolvedValue({
                    status: 1,
                    token: '0x0',
                    usersFor: [],
                    usersAgainst: [],
                    amountFor: 1,
                    amountAgainst: 1,
                    challengeType: 'individual',
                    startTime: '1294823423',
                    endTime: '2134243523',
                  }),
                }
              }),
              decimals: jest.fn().mockImplementation(() => {
                if (resolved === 3) {
                  return {
                    call: jest.fn().mockResolvedValue('1002098324234'),
                  }
                }
                return {
                  call: jest.fn().mockResolvedValue('18'),
                }
              }),
            },
            events: {
              allEvents: jest.fn().mockReturnValue({
                on: jest.fn().mockImplementation((event, callback) => {
                  // Simulate an event being emitted
                  if (event === 'data') {
                    callback({
                      returnValues: {
                        from: '0xFromAddress',
                        to: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                      },
                    })
                  }
                }),
              }),
            },
          }
        }),
        accounts: {
          privateKeyToAccount: jest.fn().mockImplementation(() => {
            if (resolved === 10) {
              return {
                address: '0x000000',
                signTransaction: jest.fn().mockRejectedValue(null),
              }
            }
            return {
              address: '0x000000',
              signTransaction: jest.fn().mockResolvedValue({}),
            }
          }),
        },
        getTransactionReceipt: jest.fn().mockImplementation(() => {
          if (resolved === 1 || resolved === 5 || resolved === 7) {
            return Promise.resolve({
              blockNumber: 123456,
              status: 1235,
              by: '0x0',
            })
          }
          if (resolved === 2) {
            return Promise.resolve(null)
          }
          if (resolved === 4) {
            return Promise.resolve({})
          }
          return null
        }),
        getGasPrice: jest.fn().mockImplementation(() => {
          if (resolved === 3) {
            return Promise.reject({})
          }
          return Promise.resolve('120000000')
        }),
        getTransactionCount: jest.fn().mockImplementation(() => {
          return Promise.resolve(1)
        }),
        sendSignedTransaction: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            transactionHash: '0xtransactionhash',
          })
        }),
        getBlockNumber: jest.fn().mockImplementation(() => {
          if (resolved === 1) {
            return Promise.resolve('1500')
          }
          return null
        }),
      },
      utils: {
        fromWei: jest.fn().mockResolvedValue(1000000),
      },
    }
  })
})

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/redis', (): object => ({
  getRedisKey: jest.fn().mockImplementation(() => {
    if (resolved === 5 || resolved === 7) {
      return '0xtransaction_hash'
    } else {
      return null
    }
  }),
  setRedisKey: jest.fn(),
}))

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation(() => {
    if (resolved === 9) {
      return {
        format: 'standard-v1',
        tree: [
          '0xce4859ac815da091526d7f8e49519a6389c08054773679d5901f47f6215df7a2',
          '0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7',
          '0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6',
          '0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c',
          '0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c',
          '0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b',
          '0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223',
          '0x3ea4e7d1dfe77983c13bba776027501fcd75790fc88fbb372791c92a798394db',
          '0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9',
        ],
        values: [
          {
            value: [
              '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
              4,
              '5000000000000000000',
              '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              '10000000000000000000',
            ],
            treeIndex: 4,
          },
          {
            value: [
              '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              2,
              '10000000000000000000',
              '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
              '12500000000000000000',
            ],
            treeIndex: 6,
          },
          {
            value: [
              '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
              3,
              '15000000000000000000',
              '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
              '15000000000000000000',
            ],
            treeIndex: 7,
          },
          {
            value: [
              '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
              4,
              '20000000000000000000',
              '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
              '20000000000000000000',
            ],
            treeIndex: 8,
          },
          {
            value: [
              '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
              1,
              '20000000000000000000',
              '0x0000000000000000000000000000000000000000',
              '20000000000000000000',
            ],
            treeIndex: 5,
          },
        ],
        leafEncoding: ['address', 'uint256', 'uint256', 'address', 'uint256'],
      }
    }
    if (resolved === 11) {
      return JSON.stringify({
        // dump: jest.fn().mockResolvedValue('{}'),
        format: 'standard-v1',
        tree: [
          '0xce4859ac815da091526d7f8e49519a6389c08054773679d5901f47f6215df7a2',
          '0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7',
          '0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6',
          '0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c',
          '0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c',
          '0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b',
          '0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223',
          '0x3ea4e7d1dfe77983c13bba776027501fcd75790fc88fbb372791c92a798394db',
          '0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9',
        ],
        values: [
          {
            value: [
              '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
              4,
              '5000000000000000000',
              '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              '10000000000000000000',
            ],
            treeIndex: 4,
          },
          {
            value: [
              '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              2,
              '10000000000000000000',
              '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
              '12500000000000000000',
            ],
            treeIndex: 6,
          },
          {
            value: [
              '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
              3,
              '15000000000000000000',
              '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
              '15000000000000000000',
            ],
            treeIndex: 7,
          },
          {
            value: [
              '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
              4,
              '20000000000000000000',
              '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
              '20000000000000000000',
            ],
            treeIndex: 8,
          },
          {
            value: [
              '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
              1,
              '20000000000000000000',
              '0x0000000000000000000000000000000000000000',
              '20000000000000000000',
            ],
            treeIndex: 5,
          },
        ],
        leafEncoding: ['address', 'uint256', 'uint256', 'address', 'uint256'],
      })
    } else {
      return null
    }
  }),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn().mockImplementation(() => {
    if (resolved === 9) {
      return {
        size: jest.fn().mockResolvedValue(1),
      }
    } else {
      return {
        size: jest.fn().mockResolvedValue(0),
      }
    }
  }),
}))

describe('Web3', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
    jest.clearAllMocks()
  })

  // cancel challenge
  it('should not cancel challenge when token name is invalid', async () => {
    resolved = 5
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue(null)

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue(null)

    await expect(
      cancelChallenge('1', BlockchainNetworks.Arbitrum, '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c', 100, 1, abi),
    ).rejects.toThrow(new Error(`ChallengeCanceled: tokenName is invalid : undefined`))
  })

  it('should not cancel challenge when token name is invalid, while getting getting challenge funds from tx hash after getting transaction receipt', async () => {
    resolved = 1
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValueOnce({})

    await cancelChallenge('1', BlockchainNetworks.Ethereum, '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c', 100, 1, abi)
    // new Error(`ChallengeCanceled: tokenName is invalid: null`)
  })
  it('should return when challenge is already cancelled and found ChallengeCanceled event in scTransactions table', async () => {
    resolved = 5
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue({
      rawData: {
        transactionHash: '0xtransactionHash',
        challengeId: '1',
        winnersProfit: [{ originalStakedQty: 1, valueInUSD: 1 }],
      },
    })

    await cancelChallenge('1', BlockchainNetworks.Ethereum, '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c', 100, 1, abi)
    expect(logger.info).toHaveBeenCalledWith(
      `ChallengeCanceled: event: ${JSON.stringify({
        rawData: {
          transactionHash: '0xtransactionHash',
          challengeId: '1',
          winnersProfit: [{ originalStakedQty: 1, valueInUSD: 1 }],
        },
      })}`,
    )
  })

  it('should return when challenge is already cancelled and not found any ChallengeCanceled event in scTransactions table', async () => {
    resolved = 5
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
      tokenName: 'eth',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue(null)

    await cancelChallenge('1', BlockchainNetworks.Arbitrum, '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c', 100, 1, abi)
    expect(logger.info).toHaveBeenCalledWith(
      `ChallengeCanceled: event: ${JSON.stringify({
        rawData: {
          transactionHash: '0xtransactionHash',
          challengeId: '1',
          winnersProfit: [{ originalStakedQty: 1, valueInUSD: 1 }],
        },
      })}`,
    )
  })

  it('should return when challenge is already cancelled and not found any ChallengeCanceled event in scTransactions table and transactionHash against challenge id also not found', async () => {
    resolved = 6
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue(null)

    await expect(
      cancelChallenge('1', BlockchainNetworks.Arbitrum, '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c', 100, 1, abi),
    ).rejects.toThrowError(
      `ChallengeCanceled: Tx Hash is not present in redis against internalChallengeId: 100 for further processing.`,
    )
  })

  it('should cancel the challenge', async () => {
    resolved = 1

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
      tokenName: 'Eth',
    })
    await cancelChallenge('1', BlockchainNetworks.Arbitrum, '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c', 100, 1, abi)
    expect(logger.info).toHaveBeenCalledWith(`Challenge Cancelled Successfully`)
  })

  it('should not cancel challenge', async () => {
    resolved = 2
    expect(
      await cancelChallenge(
        '1',
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        100,
        1,
        abi,
      ),
    ).toEqual(null)
  })

  it('should not cancel challenge when the block number is invalid', async () => {
    resolved = 4
    expect(
      await cancelChallenge(
        '1',
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        100,
        1,
        abi,
      ),
    ).toEqual(null)
  })

  it('should cancel participation', async () => {
    resolved = 1
    await cancelParticipation(
      '0x59fcCB18F3b19B3282b27Ca20169732880Fdb3A6',
      '1',
      BlockchainNetworks.Arbitrum,
      '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
      1,
      abi,
    )
    expect(logger.info).toHaveBeenCalledWith(`Challenge Participation Cancelled Successfully`)
  })

  it('should not cancel participation', async () => {
    resolved = 2
    expect(
      await cancelParticipation(
        '0x59fcCB18F3b19B3282b27Ca20169732880Fdb3A6',
        '1',
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        abi,
      ),
    ).toEqual(null)
  })

  // challenge resolved
  it(
    'should return when challenge is already resolved and found ChallengeFundsMoved event in scTransaction table',
    async () => {
      resolved = 7

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.challenges.findFirst.mockResolvedValue({
        contractId: 1,
      })

      const eventData = {
        method: 'ChallengeFundsMoved',
        blockNum: 79934045,
        networkId: 2,
        mothodType: 2,
        challengeId: 303,
        winnersProfit: [
          {
            valueInUSD: 11.29128,
            originalStakedQty: 11.28,
          },
        ],
        losersLoss: [
          {
            valueInUSD: 11.28,
            originalStakedQty: 11.28,
          },
        ],
        transactionHash: '0x2e77571bc5dda0abc76f98d3fc700b74be6fd3d64db8b3d4804e9f73a530924c',
      }
      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.contracts.findFirst.mockResolvedValue({
        networkId: '2',
      })

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.scTransactions.findFirst.mockResolvedValue({
        rawData: {
          ...eventData,
        },
      })

      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      )
      expect(logger.info).toHaveBeenCalledWith(
        `ChallengeResolved: event: ${JSON.stringify({
          rawData: {
            ...eventData,
          },
        })}`,
      )
    },
    1000 * 1000,
  )

  it(
    'should return when challenge is already resolved and not found ChallengeFundsMoved event in scTransaction table',
    async () => {
      resolved = 7

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.challenges.findFirst.mockResolvedValue({
        contractId: 1,
      })

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.contracts.findFirst.mockResolvedValue({
        networkId: '2',
        tokenName: 'ETH',
      })

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.scTransactions.findFirst.mockResolvedValue(null)

      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      )
    },
    1000 * 1000,
  )

  it(
    'should return when challenge is already resolved and token is invalid',
    async () => {
      resolved = 7

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.challenges.findFirst.mockResolvedValue({
        contractId: 1,
      })

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.contracts.findFirst.mockResolvedValue({
        networkId: '2',
      })

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.scTransactions.findFirst.mockResolvedValue(null)

      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      )
    },
    1000 * 1000,
  )

  it(
    'should return when challenge is already resolved and not found ChallengeFundsMoved event in scTransaction table and transaction hash is not present in redis',
    async () => {
      resolved = 8

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.challenges.findFirst.mockResolvedValue({
        contractId: 1,
      })

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.scTransactions.findFirst.mockResolvedValue(null)

      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      )
    },
    1000 * 1000,
  )

  it(
    'should resolve the challenge',
    async () => {
      resolved = 1

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.contracts.findFirst.mockResolvedValue({
        networkId: '2',
        tokenName: 'ETH',
      })
      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      )

      resolved = 1

      // @ts-expect-error We are mocking function so won't cause any issue
      prismaClient.contracts.findFirst.mockResolvedValue({
        networkId: '2',
      })
      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      )
    },
    1000 * 1000,
  )

  it('should not resolve the challenge', async () => {
    resolved = 2
    expect(
      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      ),
    ).toEqual(null)

    resolved = 3
    expect(
      await resolveChallenge(
        [1],
        [1],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      ),
    ).toEqual(null)
  })

  it('should return when group challenge is already resolved and found ChallengeFundsMoved event in scTransaction table', async () => {
    resolved = 7
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
      tokenName: 'Eth',
    })

    const eventData = {
      method: 'ChallengeFundsMoved',
      blockNum: 79934045,
      networkId: 2,
      mothodType: 2,
      challengeId: 303,
      winnersProfit: [
        {
          valueInUSD: 11.29128,
          originalStakedQty: 11.28,
        },
      ],
      losersLoss: [
        {
          valueInUSD: 11.28,
          originalStakedQty: 11.28,
        },
      ],
      transactionHash: '0x2e77571bc5dda0abc76f98d3fc700b74be6fd3d64db8b3d4804e9f73a530924c',
    }
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue({
      rawData: {
        ...eventData,
      },
    })

    await resolveGroupChallenge(
      1,
      ['0xwinne1', '0xwinne2'],
      [100, 10],
      BlockchainNetworks.Arbitrum,
      '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
      1,
      '0x0000000000000000000000000000000000000000',
      abi,
    )
  })

  it('should return when group challenge is already resolved and not found ChallengeFundsMoved event in scTransaction table', async () => {
    resolved = 7

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue(null)

    await resolveGroupChallenge(
      1,
      ['0xwinne1', '0xwinne2'],
      [100, 10],
      BlockchainNetworks.Arbitrum,
      '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
      1,
      '0x0000000000000000000000000000000000000000',
      abi,
    )

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
      tokenName: 'ETH',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue(null)

    await resolveGroupChallenge(
      1,
      ['0xwinne1', '0xwinne2'],
      [100, 10],
      BlockchainNetworks.Arbitrum,
      '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
      1,
      '0x0000000000000000000000000000000000000000',
      abi,
    )
  })

  it('should return when group challenge is already resolved and not found ChallengeFundsMoved event and tx hash not found', async () => {
    resolved = 8

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.challenges.findFirst.mockResolvedValue({
      contractId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.scTransactions.findFirst.mockResolvedValue(null)

    await resolveGroupChallenge(
      1,
      ['0xwinne1', '0xwinne2'],
      [100, 10],
      BlockchainNetworks.Arbitrum,
      '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
      1,
      '0x0000000000000000000000000000000000000000',
      abi,
    )
  })
  it('should resolve the group challenge', async () => {
    resolved = 1

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
      tokenName: 'Eth',
    })

    await resolveGroupChallenge(
      1,
      ['0xwinne1', '0xwinne2'],
      [100, 10],
      BlockchainNetworks.Arbitrum,
      '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
      1,
      '0x0000000000000000000000000000000000000000',
      abi,
    )

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networkId: '2',
    })

    await resolveGroupChallenge(
      1,
      ['0xwinne1', '0xwinne2'],
      [100, 10],
      BlockchainNetworks.Arbitrum,
      '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
      1,
      '0x0000000000000000000000000000000000000000',
      abi,
    )
  })

  it('should not resolve the group challenge', async () => {
    resolved = 2

    expect(
      await resolveGroupChallenge(
        1,
        ['0xwinne1', '0xwinne2'],
        [100, 10],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      ),
    ).toEqual(null)

    resolved = 3
    expect(
      await resolveGroupChallenge(
        1,
        ['0xwinne1', '0xwinne2'],
        [100, 10],
        BlockchainNetworks.Arbitrum,
        '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
        1,
        '0x0_token_address',
        abi,
      ),
    ).toEqual(null)
  })

  it('should return challenge details', async () => {
    resolved = 1
    expect(
      await getChallengeDetails('1', BlockchainNetworks.Arbitrum, '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c', abi),
    ).toEqual({
      status: 1,
      token: '0x0',
      usersFor: [],
      usersAgainst: [],
      amountFor: 1,
      amountAgainst: 1,
      challengeType: 'individual',
      startTime: '1294823423',
      endTime: '2134243523',
    })
  })

  it('should return the get current block number', async () => {
    const mockUrl = 'https://mockurl.com'
    const mockPayload = { jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: ['latest', false] }
    const mockToken = 'mockToken'
    await fetchWithHeaders(mockUrl, mockPayload, mockToken)

    expect(await getCurrentBlockNumber(BlockchainNetworks.Arbitrum)).toEqual('1500')
  })

  it('loads .env.example file when GITHUB_ACTIONS is set', () => {
    process.env.GITHUB_ACTIONS = 'true'

    jest.isolateModules(() => {
      require('./utils/envs')
    })

    expect(dotenvExtended.load).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '.env',
      }),
    )
  })

  // merkle tree flow
  it('checkUserTokenBalance() should return user token balance', async () => {
    const balance = await checkUserTokenBalance(
      BlockchainNetworks.Arbitrum,
      'contractAddress',
      'abi',
      '0xWalletAddress',
    )
    expect(balance).toBe('1.2e-10')
  })

  //TODO: need to update this test
  xit('getSubscriber should return the subscription object and token', async () => {
    const result = await getSubscriber(BlockchainNetworks.Arbitrum, 'abiFile', 'contractAddress')
    expect(result).toHaveProperty('subscription')

    // Optionally, check for specific properties within `subscription` and `token` objects
    expect(result.subscription).toHaveProperty('on')
  })

  it("create merkle tree when tree doesn't exist already", async () => {
    resolved = 10
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.findMany.mockResolvedValue([{ walletAddress: 0x01 }, { walletAddress: 0x02 }])

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.findUnique.mockResolvedValue({
      userId: 'user2',
      walletAddress: '0xdef456',
      firstName: 'Jane',
      lastName: 'Smith',
      referrerUserId: 'user1',
      membershipLevel: {
        levelId: 1,
        levelName: 'Premium',
        feeDeductionPct: 10.0,
        referralBonusPct: 5.0,
      },
      referrer: {
        userId: 'user1',
        walletAddress: '0xabc123',
        firstName: 'John',
        lastName: 'Doe',
        referrerUserId: null,
        membershipLevel: {
          levelId: 1,
          levelName: 'Basic',
          feeDeductionPct: 5.0,
          referralBonusPct: 2.0,
        },
      },
    })

    await createMerkleTree(['0xWalletAddress1', '0xWalletAddress2'])

    expect(prismaClient.users.findUnique).toHaveBeenCalledTimes(2)
  })

  it('create merkle tree when tree exist and found, wallet address does exist in the tree', async () => {
    resolved = 9
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.findUnique.mockResolvedValue({
      userId: 'user2',
      walletAddress: '0xdef456',
      firstName: 'Jane',
      lastName: 'Smith',
      referrerUserId: 'user1',
      membershipLevel: {
        levelId: 1,
        levelName: 'Premium',
        feeDeductionPct: 10.0,
        referralBonusPct: 5.0,
      },
      referrer: {
        userId: 'user1',
        walletAddress: '0xabc123',
        firstName: 'John',
        lastName: 'Doe',
        referrerUserId: null,
        membershipLevel: {
          levelId: 1,
          levelName: 'Basic',
          feeDeductionPct: 5.0,
          referralBonusPct: 2.0,
        },
      },
    })

    await createMerkleTree(['0xWalletAddress1', '0xWalletAddress2'])

    expect(prismaClient.users.findUnique).toHaveBeenCalledTimes(2)
  })

  it("create merkle tree when tree exist and found, wallet address doesn't exist in the tree and user also not found in db", async () => {
    resolved = 9
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.findUnique.mockResolvedValue({
      userId: 'user2',
      walletAddress: '0xdef456',
      firstName: 'Jane',
      lastName: 'Smith',
      referrerUserId: 'user1',
      membershipLevel: {
        levelId: 1,
        levelName: 'Premium',
        feeDeductionPct: 10.0,
        referralBonusPct: 5.0,
      },
      referrer: {
        userId: 'user1',
        walletAddress: '0xabc123',
        firstName: 'John',
        lastName: 'Doe',
        referrerUserId: null,
        membershipLevel: {
          levelId: 1,
          levelName: 'Basic',
          feeDeductionPct: 5.0,
          referralBonusPct: 2.0,
        },
      },
    })

    await createMerkleTree(['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'])

    expect(prismaClient.users.findUnique).toHaveBeenCalledTimes(2)
  })

  it('should generate proof', async () => {
    resolved = 11
    const walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    const proof = await generateProof(walletAddress)

    expect(proof).toEqual(['proof1', 'proof2'])
    expect(StandardMerkleTree.load).toHaveBeenCalled()
  })

  it('should not generate proof', async () => {
    resolved = 11

    const proof = await generateProof('')

    expect(proof).toEqual(null)
    expect(StandardMerkleTree.load).toHaveBeenCalled()
  })

  it('should not update root', async () => {
    resolved = 3

    expect(await updateMerkleRoot('0x0', BlockchainNetworks.Arbitrum, '', '')).toEqual(null)

    resolved = 10

    expect(await updateMerkleRoot('0x0', BlockchainNetworks.Arbitrum, '', '')).toEqual(null)
  })
})
