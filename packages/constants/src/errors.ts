import { HTTP_RESPONSE_STATUS } from './http'

export const ERROR_CODES = {
  AUTH: {
    MISSING_TOKEN: {
      CODE: 'AUTH_001',
      HTTP_STATUS: HTTP_RESPONSE_STATUS.BAD_REQUEST,
      MESSAGE: 'Authentication token is missing',
    },
  },
  DB: {
    CONNECTION_FAILED: {
      CODE: 'DB_001',
      HTTP_STATUS: HTTP_RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      MESSAGE: 'Database connection failed',
    },
  },
  GAMES: {
    FETCH_GAMES_LIST: {
      CODE: 'GAMES_001',
      HTTP_STATUS: HTTP_RESPONSE_STATUS.BAD_REQUEST,
      MESSAGE: 'Failed to fetch games',
    },
  },
  MISC: {
    SOMETHING_WENT_WRONG: {
      CODE: 'MISC_001',
      HTTP_STATUS: HTTP_RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      MESSAGE: 'Something went wrong',
    },
  },
  USER: {
    NOT_FOUND: {
      CODE: 'USER_002',
      HTTP_STATUS: HTTP_RESPONSE_STATUS.NOT_FOUND,
      MESSAGE: 'User not found',
    },
  },
} as const
