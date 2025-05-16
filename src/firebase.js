import { initializeApp } from 'firebase/app'

import { FIREBASE } from '@/constants/firebase'

const firebaseConfig = {
	apiKey: FIREBASE.API_KEY,
	authDomain: FIREBASE.AUTH_DOMAIN,
	databaseURL: FIREBASE.DATABASE_URL,
	projectId: FIREBASE.PROJECT_ID,
	storageBucket: FIREBASE.STORAGE_BUCKET,
	messagingSenderId: FIREBASE.MESSAGING_SENDER_ID,
	appId: FIREBASE.APP_ID,
	measurementId: FIREBASE.MEASUREMENT_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
