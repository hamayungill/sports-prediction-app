import {
  seedApiSources,
  seedBlacklistLocations,
  seedBookmakers,
  seedCategoriesGroupsSubgroups,
  seedContracts,
  seedIpLocations,
  seedMembershipLevels,
  seedPreferences,
  seedQuests,
  seedRoles,
  seedSports,
} from './seeds'
import prismaClient from '../index'

const main = async (): Promise<void> => {
  // Do not change the order of seeder functions
  await seedRoles()
  await seedApiSources()
  await seedBlacklistLocations()
  await seedSports()
  await seedContracts()
  await seedCategoriesGroupsSubgroups()
  await seedBookmakers()
  await seedMembershipLevels()
  await seedQuests()
  await seedPreferences()
  await seedIpLocations()
}

main()
  .then(async () => {
    await prismaClient.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prismaClient.$disconnect()
    process.exit(1)
  })
