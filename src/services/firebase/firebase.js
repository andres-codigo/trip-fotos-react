import { initializeApp } from 'firebase/app'
import {
	browserLocalPersistence,
	connectAuthEmulator,
	initializeAuth,
} from 'firebase/auth'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

import { FIREBASE, FIREBASE_EMULATORS } from '@/constants/firebase'

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
	if (!firebaseAuth) {
		firebaseAuth = initializeAuth(firebaseApp, {
			persistence: browserLocalPersistence,
		})
		if (FIREBASE_EMULATORS.ENABLED) {
			connectAuthEmulator(firebaseAuth, FIREBASE_EMULATORS.AUTH_URL, {
				disableWarnings: true,
			})
		}
	}
	return firebaseAuth
}

let firebaseStorage

// Storage only attaches the user's token once Auth is initialised for the app and has restored the saved session
export const getFirebaseStorage = () => {
	getFirebaseAuth()
	if (!firebaseStorage) {
		firebaseStorage = getStorage(firebaseApp)
		if (FIREBASE_EMULATORS.ENABLED) {
			connectStorageEmulator(
				firebaseStorage,
				FIREBASE_EMULATORS.STORAGE_HOST,
				FIREBASE_EMULATORS.STORAGE_PORT,
			)
		}
	}
	return firebaseStorage
}
