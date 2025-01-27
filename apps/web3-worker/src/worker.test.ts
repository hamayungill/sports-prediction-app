import prismaClient, { BlockchainNetworks } from '@duelnow/database'
import { getSubscriber } from '@duelnow/web3'
import * as dotenvExtended from 'dotenv-extended'
import { v4 as uuidv4 } from 'uuid'

import { producer } from './utils/kafkaProducer'
import { startWorker } from './worker'

jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

jest.mock('@duelnow/kafka-client', () => ({
  sendAlert: jest.fn(),
}))

jest.mock('@duelnow/database', () => {
  const actualPrisma = jest.requireActual('@duelnow/database')
  return {
    __esModule: true,
    default: {
      blockchainNetworks: {
        findFirst: jest.fn(),
      },
      scTransactions: {
        create: jest.fn(),
      },
      contracts: {
        findFirst: jest.fn(),
      },
      membershipLevels: {
        findFirst: jest.fn(),
      },
      users: {
        findFirst: jest.fn(),
      },
    },
    Prisma: {
      ...actualPrisma.Prisma,
    },
    BlockchainNetworks: actualPrisma.BlockchainNetworks,
  }
})

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(() => ({ getLogger: jest.fn() })),
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('@duelnow/web3', () => {
  const mockOn = jest.fn()
  const mockError = jest.fn()
  const mockConnected = jest.fn()

  return {
    getSubscriber: jest.fn().mockResolvedValue({
      subscription: { on: mockOn, error: mockError, connected: mockConnected },
      token: {
        networks: {
          networkId: 1,
          name: 'Ethereum Mainnet',
        },
        abiFile: 'mockedAbi',
        contractAddress: 'mockedContractAddress',
        contractId: 'mockedContractId',
      },
    }),
    checkUserTokenBalance: jest.fn(),
    createMerkleTree: jest.fn(),
  }
})

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  getLogger: jest.fn(),
}))

jest.mock('@duelnow/utils', () => {
  const actualUtils = jest.requireActual('@duelnow/utils')
  return {
    WORKERS: actualUtils.WORKERS,
    TOPICS: actualUtils.TOPICS,
    EVENTS: actualUtils.EVENTS,
    BlockchainEvents: actualUtils.BlockchainEvents,
    ContractType: actualUtils.ContractType,
    RETRY: actualUtils.RETRY,
    NonRetriableError: jest.fn().mockImplementation((message) => {
      const error = new Error(message)
      error.name = 'NonRetriableError'
      return error
    }),
    RetriableError: jest.fn().mockImplementation((message) => {
      const error = new Error(message)
      error.name = 'RetriableError'
      return error
    }),
    AlertPriority: actualUtils.AlertPriority,
  }
})

jest.mock('@duelnow/kafka-client', () => {
  return {
    ...jest.requireActual('@duelnow/kafka-client'),
    KafkaProducer: jest.fn(),
    retryHandler: jest.fn().mockImplementation(() => {
      return Promise.resolve()
    }),
    sendToDlqAndAlert: jest.fn(),
    sendToRetryTopic: jest.fn().mockImplementation(() => {
      return true
    }),
    sendAlert: jest.fn(),
    validateHeaders: jest.fn().mockImplementation(() => {
      return true
    }),
    validateMessageValue: jest.fn().mockImplementation(() => {
      return true
    }),
    sendMessage: jest.fn().mockResolvedValue({}),
  }
})

describe('Web3 Worker', () => {
  beforeEach(() => {})

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('loads .env.example file when GITHUB_ACTIONS is set', () => {
    process.env.GITHUB_ACTIONS = 'true'

    jest.isolateModules(() => {
      require('./utils/const')
    })

    expect(dotenvExtended.load).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '.env.example',
      }),
    )
  })

  it('should subscribe the events', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.blockchainNetworks.findFirst.mockResolvedValue({
      networkId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      abiFile: 'abi',
      contractAddress: 'contractAddress',
      networks: {
        networkId: 1,
        name: 'Ethereum Mainnet',
      },
      contractId: 'contractId',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.membershipLevels.findFirst.mockResolvedValue({
      levelId: 2,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.findFirst.mockResolvedValue({
      membershipLevelId: 1,
    })

    const subscriber = await getSubscriber(BlockchainNetworks.Arbitrum, 'contractAddress', 'abiFile')

    const mockData = {
      returnValues: { from: '0xfrom', to: '0xto' },
      event: 'Transfer',
      transactionHash: '0x0',
      blockNumber: 1234,
    }

    subscriber.subscription.on.mockImplementation(
      (
        event: string,
        callback: (arg0: {
          returnValues: { from: string; to: string }
          event: string
          transactionHash: string
          blockNumber: number
        }) => void,
      ) => {
        if (event === 'data') {
          callback(mockData)
        }
      },
    )

    jest.mock('./utils', () => ({
      ...jest.requireActual('./utils'),
      producer: {
        sendMessage: jest.fn(),
      },
    }))
    producer.sendMessage = jest.fn()

    // @ts-expect-error We are mocking function so won't cause any issue
    uuidv4.mockReturnValue('mocked-uuid-value')

    await startWorker()
  })

  it('should subscribe the events but not update the membership level', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.blockchainNetworks.findFirst.mockResolvedValue({
      networkId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      abiFile: 'abi',
      contractAddress: 'contractAddress',
      networks: {
        networkId: 1,
        name: 'Ethereum Mainnet',
      },
      contractId: 'contractId',
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.membershipLevels.findFirst.mockResolvedValue({
      levelId: 2,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.users.findFirst.mockResolvedValue({
      membershipLevelId: 2,
    })

    const subscriber = await getSubscriber(BlockchainNetworks.Arbitrum, 'contractAddress', 'abiFile')

    const mockData = {
      returnValues: { from: '0xfrom', to: '0xto' },
      event: 'Transfer',
      transactionHash: '0x0',
      blockNumber: 1234,
    }

    subscriber.subscription.on.mockImplementation(
      (
        event: string,
        callback: (arg0: {
          returnValues: { from: string; to: string }
          event: string
          transactionHash: string
          blockNumber: number
        }) => void,
      ) => {
        if (event === 'data') {
          callback(mockData)
        }
      },
    )

    jest.mock('./utils', () => ({
      ...jest.requireActual('./utils'),
      producer: {
        sendMessage: jest.fn(),
      },
    }))
    producer.sendMessage = jest.fn()

    // @ts-expect-error We are mocking function so won't cause any issue
    uuidv4.mockReturnValue('mocked-uuid-value')

    await startWorker()
  })

  it('should throw an alert when error message received', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.blockchainNetworks.findFirst.mockResolvedValue({
      networkId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      networks: {
        networkId: 1,
        name: 'Ethereum Mainnet',
      },
      abiFile: 'abi',
      contractAddress: 'contractAddress',
      contractId: 'contractId',
    })
    const subscriber = await getSubscriber(BlockchainNetworks.Arbitrum, 'contractAddress', 'abiFile')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscriber.subscription.on.mockImplementation((event: string, callback: (arg0: any) => void) => {
      if (event === 'error') {
        callback({ error: 'err' })
      }
    })
    await startWorker()
  })

  it('should connect the subscriber', async () => {
    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.blockchainNetworks.findFirst.mockResolvedValue({
      networkId: 1,
    })

    // @ts-expect-error We are mocking function so won't cause any issue
    prismaClient.contracts.findFirst.mockResolvedValue({
      abiFile: 'abi',
      contractAddress: 'contractAddress',
      networks: {
        networkId: 1,
        name: 'Ethereum Mainnet',
      },
      contractId: 'contractId',
    })
    const subscriber = await getSubscriber(BlockchainNetworks.Arbitrum, 'contractAddress', 'abiFile')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscriber.subscription.on.mockImplementation((event: string, callback: (arg0: any) => void) => {
      if (event === 'connected') {
        callback({ connected: 'ok' })
      }
    })
    await startWorker()
  })
})
