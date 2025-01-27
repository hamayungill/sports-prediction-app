const TOPICS = {
  SPORTS: {
    SEASON: 'push.sport.seasons',
    LEAGUE: 'push.sport.leagues',
    GAME: 'push.sport.games',
    TEAM: 'push.sport.teams',
    PLAYER: 'push.sport.players',
    GAMESTATS: 'push.sport.gamestats',
    PLAYERSTATS: 'push.sport.playerstats',
    GAMEODDS: 'push.challenge.odds',
    TEAMSTATS: 'push.sport.teamstats',
  },
  SYSTEM: {
    RETRY_ONE: 'system.retry.one',
    RETRY_TWO: 'system.retry.two',
    DLQ: 'dead.letter.queue',
    ALERT: 'system.alert',
  },
  TRACKING: {
    USER: {
      EVENTS: 'tracking.user.events',
    },
    QUEST: {
      USERQUESTS: 'tracking.quest.userquests',
    },
  },
  USER: {
    QUEST: {
      LEDGER: 'user.quest.ledger',
    },
    USER: {
      USERS: 'user.user.users',
    },
  },
}

const EVENTS = {
  AUTH: {
    SIGN_IN_COMPLETED: 'sign_in_completed',
    SIGN_UP_COMPLETED: 'sign_up_completed',
    SIGN_OUT_COMPLETED: 'sign_out_completed',
    WAITLIST_JOINED: 'waitlist_joined',
    BULK_WAITLIST_JOINED: 'bulk_waitlist_joined',
  },
  BET: {
    CREATED: 'bet_created',
    JOINED: 'bet_joined',
    WON: 'bet_won',
    LOST: 'bet_lost',
    CANCELLED: 'bet_cancelled',
  },
  TRACKING: {
    BET_CONVERTED: 'bet_converted',
    EMAIL_VERIFICATION_SENT: 'email_verification_sent',
    EMAIL_VERIFIED: 'email_verified',
    PAGE_VIEWED: 'page_viewed',
    PARTIAL_BET_REQUEST_INITIATED: 'partial_bet_request_initiated',
    PARTIAL_BET_REQUEST_DECIDED: 'partial_bet_request_decided',
    PROFILE_UPDATED: 'profile_updated',
    REQUEST_BLOCKED: 'request_blocked',
    USER_IDENTIFIED: 'user_identified',
    MEMBERSHIP_UPDATED: 'membership_updated',
    REFERRAL_BONUS_EARNED: 'referral_bonus_earned',
  },
  ALERT: {
    RESULTS_TO_SC_PUBLISHED: 'results_to_sc_published',
    PICKEM_RESULTS_TO_SC_PUBLISHED: 'pickem_results_to_sc_published',
    CHALLENGE_IN_SC_CANCELED: 'challenges_in_sc_canceled',
    PREDICTION_TO_RESULT_CALCULATED: 'prediction_to_result_calculated',
  },
  QUEST: {
    COMPLETED: 'quest_completed',
    GOAL: {
      ACHIEVED: 'quest_goal_achieved',
      PROGRESSED: 'quest_goal_progressed',
      REVERTED: 'quest_goal_reverted',
    },
  },
}

const WORKERS = {
  // to determine from which worker retry message produced and provide the callback accordingly
  CUSTOMERIO: 'customerio-worker',
  SPORTS: 'sports-worker',
  EVENT: 'event-worker',
  MIXPANEL: 'mixpanel-worker',
  ALERT: 'alert-worker',
  QUEST: 'quest-worker',
  USER: 'user-worker',
  WEB3: 'web3-package',
}

enum RETRY {
  CHECK,
  INCREMENT,
  DECREMENT,
}

export { EVENTS, RETRY, TOPICS, WORKERS }
