import prismaClient, { BlockchainNetworks, Prisma } from '../../index'
import { DNOW_abiV1_0_0, abiV1_0_0, abiV1_0_1, abiV1_0_2, abiV1_0_3 } from '../utils/abi'
import { NODE_ENV } from '../utils/const'

const { ContractType, Status } = Prisma
const { contracts, blockchainNetworks } = prismaClient

const networksData = [
  {
    name: BlockchainNetworks.Ethereum,
  },
  {
    name: BlockchainNetworks.Arbitrum,
  },
]

export const contractsDataForQA = [
  {
    contractType: ContractType.Sport,
    contractAddress: '0x7D0E98f301f21a44e9882978355a83b513F611F0',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Restricted,
    abiFile: abiV1_0_0,
    note: 'v1.0.0',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0xd3978A4f5b325c086cC9aDE4C57cd012dd21EA05',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Restricted,
    abiFile: abiV1_0_0,
    note: 'v1.0.0',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x80Dd0AB206153C791d2108Cf3ED0edf2E1d78c7d',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Restricted,
    abiFile: abiV1_0_1,
    note: 'v1.0.1',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x58c4F3d0d4B173Ac1b4F0D83a7C0aC8FfEE0682c',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Restricted,
    abiFile: abiV1_0_1,
    note: 'v1.0.1',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x1130ff8e147A8b86C1a62352E5cd9cD21Fde5245',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Restricted,
    abiFile: abiV1_0_2,
    note: 'v1.0.2',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x14DeD61b67F0a30Ba3806b4642760C2E1F5B88d6',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Restricted,
    abiFile: abiV1_0_2,
    note: 'v1.0.2',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0xD44e9feD97A19b19aCd3b5780d5cFAA1B8a85745',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Restricted,
    abiFile: abiV1_0_3,
    note: 'v1.0.3',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0xe4D181635E4A2453FA10D7086dB36f2Ce84b7dc5',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Restricted,
    abiFile: abiV1_0_3,
    note: 'v1.0.3',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x9Ef381809d19b69c0ac90b8cA75E12302C904741',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    abiFile: abiV1_0_3,
    note: 'v1.0.4',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0xC98C760a187440AAcC203935b986Ef0c0Be7c7f1',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    abiFile: abiV1_0_3,
    note: 'v1.0.4',
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x6624C8bF12Eca9811C408C98bC6dFB938A887bB4',
    tokenName: 'DNOW',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    abiFile: DNOW_abiV1_0_0,
    resourceUrl: 'https://assets.duelnow.com/DNOW.svg',
    decimals: 18,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x5e5c826D09C3F31E7FBd4a8Eed1Bec98b2b56705',
    tokenName: 'USDT',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDT.svg',
    decimals: 6,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x01ed054d50b331A1041736aCd52d148e37Ac04ca',
    tokenName: 'USDT',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDT.svg',
    decimals: 6,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0xBF91e3c9283231f43F0Bfa3FA7C56E08489E9c23',
    tokenName: 'USDC',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDC.svg',
    decimals: 8,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x1CE3FA74F80F873CF3977F497E84426621F18ad6',
    tokenName: 'USDC',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDC.svg',
    decimals: 8,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x67bb4257BB10a49AcD01508eDABD8189c884455D',
    tokenName: 'STMX',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/STMX.svg',
    decimals: 18,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x0000000000000000000000000000000000000000',
    tokenName: 'ETH',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/ETH.svg',
    decimals: 18,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x0000000000000000000000000000000000000000',
    tokenName: 'ETH',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/ETH.svg',
    decimals: 18,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0xD2037F861D7DB8213d21f8eF7423f50f74953D00',
    tokenName: 'ARB',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/ARB.svg',
    decimals: 18,
  },
]

const contractsDataForProd = [
  {
    contractType: ContractType.Sport,
    contractAddress: '0xf29Cb96BC649BBe7BcB869F15F5aE3213A84B0C4',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Restricted,
    abiFile: abiV1_0_1,
    note: 'v1.0.1',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0xDB0F1237FB8AC3cA4a02811Ce9BA1c7545C55D29',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Restricted,
    abiFile: abiV1_0_1,
    note: 'v1.0.1',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x660aF4Df78bD29bAa56De92F2E8e4f440b0805c3',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Restricted,
    abiFile: abiV1_0_2,
    note: 'v1.0.2',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x8611a15E2Ed95e82F4F6f1CADf5a6683Dd45e047',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Restricted,
    abiFile: abiV1_0_2,
    note: 'v1.0.2',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0x8473d4aFc3f43A4f9B5e105820fa67E66FB0C7B4',
    tokenName: null,
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    abiFile: abiV1_0_3,
    note: 'v1.0.3',
  },
  {
    contractType: ContractType.Sport,
    contractAddress: '0xbD8F1609dc3f0f5a2B1B3549cbe492756F3434fb',
    tokenName: null,
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    abiFile: abiV1_0_3,
    note: 'v1.0.3',
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    tokenName: 'USDT',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDT.svg',
    decimals: 6,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    tokenName: 'USDT',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDT.svg',
    decimals: 6,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenName: 'USDC',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDC.svg',
    decimals: 6,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    tokenName: 'USDC',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/USDC.svg',
    decimals: 6,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0xa62cc35625B0C8dc1fAEA39d33625Bb4C15bD71C',
    tokenName: 'STMX',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/STMX.svg',
    decimals: 18,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x0000000000000000000000000000000000000000',
    tokenName: 'ETH',
    networkName: BlockchainNetworks.Ethereum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/ETH.svg',
    decimals: 18,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x0000000000000000000000000000000000000000',
    tokenName: 'ETH',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/ETH.svg',
    decimals: 18,
  },
  {
    contractType: ContractType.Token,
    contractAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    tokenName: 'ARB',
    networkName: BlockchainNetworks.Arbitrum,
    status: Status.Active,
    resourceUrl: 'https://assets.duelnow.com/ARB.svg',
    decimals: 18,
  },
]

const seedContracts = async (): Promise<void> => {
  const networkMap: { [key: string]: number } = {}
  for (const network of networksData) {
    const networksResp = await blockchainNetworks.findFirst({
      where: {
        name: network.name,
      },
    })
    if (!networksResp) {
      const newNetwork = await blockchainNetworks.create({
        data: network,
      })
      networkMap[network.name] = newNetwork.networkId
    } else {
      networkMap[network.name] = networksResp.networkId
    }
  }

  const contractsData = NODE_ENV == 'qa' ? contractsDataForQA : NODE_ENV == 'production' ? contractsDataForProd : []
  const contractsDataWithIds = contractsData.map((contract) => {
    const { networkName, ...rest } = contract
    return {
      ...rest,
      networkId: networkMap[networkName],
    }
  })
  for (const contract of contractsDataWithIds) {
    const contractsResp = await contracts.findFirst({
      where: {
        contractType: contract.contractType,
        contractAddress: contract.contractAddress,
        networkId: contract.networkId,
      },
    })
    if (!contractsResp) {
      await contracts.create({
        data: contract,
      })
    } else {
      await contracts.update({
        where: {
          contractId: contractsResp.contractId,
        },
        data: contract,
      })
    }
  }
}

export default seedContracts
