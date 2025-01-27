import prismaClient from '../../index'
const { preferences } = prismaClient

export const preferencesData = [
  {
    name: 'profile_odds_format',
    value: {
      decimal: 1,
      american: 2,
      malaysian: 3,
      hongKong: 4,
      indonesian: 5,
    },
  },
  {
    name: 'in_app_notification',
    value: {
      optOut: 0,
      optIn: 1,
    },
  },
]

const seedPreferences = async (): Promise<void> => {
  for (const preference of preferencesData) {
    const preferenceResp = await preferences.findFirst({
      where: {
        name: preference.name,
      },
    })
    if (!preferenceResp) {
      await preferences.create({
        data: preference,
      })
    }
  }
}

export default seedPreferences
