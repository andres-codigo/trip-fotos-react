import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

import { FIREBASE } from '@/constants/firebase'

const firebaseConfig = {
	apiKey: FIREBASE.API_KEY,
	authDomain: FIREBASE.AUTH_DOMAIN,
	databaseURL: FIREBASE.DATABASE_URL,
	projectId: FIREBASE.PROJECT_ID,
	storageBucket: FIREBASE.STORAGE_BUCKET,
	messagingSenderId: FIREBASE.MESSAGING_SENDER_ID,
	appId: FIREBASE.APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)

// Lazy so importing the store doesn't throw auth/invalid-api-key where no Firebase config is set (e.g. CI)
export const getFirebaseAuth = () => getAuth(firebaseApp)

// Storage only attaches the user's token once Auth is initialised for the app and has restored the saved session
export const getFirebaseStorage = () => {
	getFirebaseAuth()
	return getStorage(firebaseApp)
}
