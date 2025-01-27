/* eslint-disable  @typescript-eslint/no-explicit-any */
import { LOGZIO_TOKEN, LOG_LEVEL } from './const'

jest.mock('dotenv-extended', () => {
  return { load: (params: any): any => params }
})

describe('Test const.ts file', () => {
  test('Test LOGZIO_TOKEN & LOG_LEVEL when no env value', () => {
    const LG_TOKEN = process.env.LOGZIO_TOKEN
    const LG_LEVEL = process.env.LOG_LEVEL

    expect(LOGZIO_TOKEN).toBe(LG_TOKEN)
    expect(LOG_LEVEL).toBe(LG_LEVEL)
  })
})
