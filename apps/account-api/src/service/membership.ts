import prismaClient, { Prisma } from '@duelnow/database'

const { membershipLevels } = prismaClient
const { Status } = Prisma

export class MembershipService {
  public async getMemberships(): Promise<Record<string, unknown>[]> {
    const membershipData = await membershipLevels.findMany({
      where: {
        status: Status.Active,
      },
    })

    return membershipData
  }
}
