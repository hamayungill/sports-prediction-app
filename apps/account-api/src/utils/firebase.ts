import firebase from 'firebase-admin'
import { applicationDefault } from 'firebase-admin/app'
import { UserRecord } from 'firebase-admin/auth'

import { logger } from './logger'

const firebaseAdmin = firebase.initializeApp({
  credential: applicationDefault(),
})

const updateFirebaseUserEmail = async (
  uid: string,
  data: { email: string; emailVerified: boolean },
): Promise<UserRecord> => {
  const auth = await firebaseAdmin.auth()
  const updateResponse = await auth.updateUser(uid, data)
  logger.debug('Firebase email update response', updateResponse)
  return updateResponse
}

export { updateFirebaseUserEmail }
