import Filter from 'bad-words'
import { NumberDictionary, adjectives, animals, colors, names, uniqueNamesGenerator } from 'unique-names-generator'

import { preRegisteredNicknames } from '../index'

const numberDictionary = NumberDictionary.generate({ min: 0, max: 99999999 })
const filter = new Filter()

export const getUniqueNickname = (length = 3): string => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors, names, numberDictionary],
    separator: '',
    style: 'capital',
    length,
  })
}

export const isValidNickname = (nickname: string): boolean =>
  typeof nickname === 'string' &&
  nickname !== '' &&
  !!nickname.match(/^[a-zA-Z0-9]{1,15}$/) &&
  !filter.isProfane(nickname) &&
  preRegisteredNicknames.every((keyword) => nickname.toLowerCase() !== keyword)
