import prismaClient from '../../index'

const { roles } = prismaClient

const seedRoles = async (): Promise<void> => {
  await roles.upsert({
    where: {
      roleName: 'user',
    },
    create: {
      roleName: 'user',
    },
    update: {
      updatedAt: new Date(),
    },
  })
}

export default seedRoles
