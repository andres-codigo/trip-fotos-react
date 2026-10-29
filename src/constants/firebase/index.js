export const FIREBASE = Object.freeze({
	// FIREBASE
	API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
	AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	DATABASE_URL: import.meta.env.VITE_DATABASE_URL,
	PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
})

// Dev server only: a production build ignores the flag, so it can never point at local emulators
export const FIREBASE_EMULATORS = Object.freeze({
	ENABLED:
		import.meta.env.DEV &&
		import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true',
	AUTH_URL: 'http://127.0.0.1:9099',
	STORAGE_HOST: '127.0.0.1',
	STORAGE_PORT: 9199,
})
