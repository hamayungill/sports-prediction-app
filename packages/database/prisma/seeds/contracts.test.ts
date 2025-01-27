import seedContracts, { contractsDataForQA } from './contracts'
import prismaClient from '../../index'

jest.mock('../../index', () => ({
  blockchainNetworks: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  contracts: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Prisma: {
    ContractType: {
      Sport: 'Sport',
      Token: 'Token',
      Staking: 'Staking',
    },
    Status: {
      Active: 'Active',
      Inactive: 'Inactive',
    },
  },
  BlockchainNetworks: {
    Ethereum: 'Ethereum',
    Arbitrum: 'Arbitrum',
  },
}))

jest.mock('../utils/const', () => ({
  ...jest.requireActual('../utils/const'), // Import everything else from the actual module
  NODE_ENV: 'qa',
}))

describe('seedContracts', () => {
  const networksData = [{ name: 'Ethereum' }, { name: 'Arbitrum' }]

  const mockNetworkResponse = { networkId: 1, name: 'Ethereum' }

  beforeEach(() => {
    jest.clearAllMocks()
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.blockchainNetworks.findFirst.mockResolvedValue(null)
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.blockchainNetworks.create.mockResolvedValue(mockNetworkResponse)
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.contracts.findFirst.mockResolvedValue(null)
  })

  it('should create blockchain networks if they do not exist', async () => {
    await seedContracts()

    expect(prismaClient.blockchainNetworks.findFirst).toHaveBeenCalledTimes(networksData.length)
    expect(prismaClient.blockchainNetworks.create).toHaveBeenCalledTimes(networksData.length)

    networksData.forEach((network) => {
      expect(prismaClient.blockchainNetworks.findFirst).toHaveBeenCalledWith({
        where: { name: network.name },
      })
      expect(prismaClient.blockchainNetworks.create).toHaveBeenCalledWith({
        data: network,
      })
    })
  })

  it('should not create blockchain networks if they already exist', async () => {
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.blockchainNetworks.findFirst.mockResolvedValue(mockNetworkResponse)

    await seedContracts()

    expect(prismaClient.blockchainNetworks.create).not.toHaveBeenCalled()
  })

  it('should create contracts if they do not exist', async () => {
    await seedContracts()
    expect(prismaClient.contracts.findFirst).toHaveBeenCalledTimes(contractsDataForQA.length)
    expect(prismaClient.contracts.create).toHaveBeenCalledTimes(contractsDataForQA.length)
  })

  it('should update contracts if they already exist', async () => {
    const existingContract = { contractId: 1 }
    // @ts-expect-error mockResolvedValue is part of jest
    prismaClient.contracts.findFirst.mockResolvedValue(existingContract)

    await seedContracts()

    expect(prismaClient.contracts.update).toHaveBeenCalledTimes(contractsDataForQA.length)
  })
})
