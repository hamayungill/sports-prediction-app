import * as Prisma from '@prisma/client'

import { BlockchainNetworks } from './prisma/utils/const'

const prismaClient = new Prisma.PrismaClient()

export { BlockchainNetworks, Prisma }

export default prismaClient
