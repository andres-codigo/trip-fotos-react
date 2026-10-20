import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, initializeAuth } from 'firebase/auth'
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

let firebaseAuth

// Lazy so importing the store doesn't throw auth/invalid-api-key where no Firebase config is set (e.g. CI).
// localStorage rather than the default IndexedDB keeps the SDK user alongside the app's own session keys, so they are restored and cleared together
export const getFirebaseAuth = () => {
	firebaseAuth ??= initializeAuth(firebaseApp, {
		persistence: browserLocalPersistence,
	})
	return firebaseAuth
}

// Storage only attaches the user's token once Auth is initialised for the app and has restored the saved session
export const getFirebaseStorage = () => {
	getFirebaseAuth()
	return getStorage(firebaseApp)
}
