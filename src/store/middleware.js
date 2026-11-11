// The 32ms default warns on a busy machine, and Vitest and Cypress fail on any console warning
export const MIDDLEWARE_WARN_AFTER_MS = 128

export const MIDDLEWARE_OPTIONS = Object.freeze({
	immutableCheck: { warnAfter: MIDDLEWARE_WARN_AFTER_MS },
	serializableCheck: {
		warnAfter: MIDDLEWARE_WARN_AFTER_MS,
		ignoredActions: [
			'persist/FLUSH',
			'persist/REHYDRATE',
			'persist/PAUSE',
			'persist/PERSIST',
			'persist/PURGE',
			'persist/REGISTER',
		],
		// File objects are passed to the upload thunk, never stored in state
		ignoredActionPaths: ['meta.arg.files'],
	},
})

export const middleware = (getDefaultMiddleware) =>
	getDefaultMiddleware(MIDDLEWARE_OPTIONS)
