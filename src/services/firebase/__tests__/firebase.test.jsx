import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initializeApp } from 'firebase/app'

vi.mock('firebase/app', () => ({
	initializeApp: vi.fn(),
}))

vi.mock('@/constants/firebase', () => ({
	FIREBASE: {
		API_KEY: 'test-api-key',
		AUTH_DOMAIN: 'test-auth-domain',
		DATABASE_URL: 'test-database-url',
		PROJECT_ID: 'test-project-id',
		STORAGE_BUCKET: 'test-storage-bucket',
		MESSAGING_SENDER_ID: 'test-messaging-sender-id',
		APP_ID: 'test-app-id',
		MEASUREMENT_ID: 'test-measurement-id',
	},
}))

describe('Firebase Configuration', () => {
	let mockApp

	beforeEach(() => {
		// Only clear return values,
		// not call history for the "calls initializeApp only once" test
		mockApp = { name: '[DEFAULT]' }
		vi.mocked(initializeApp).mockReturnValue(mockApp)
	})

	afterEach(() => {
		// Reset module registry to ensure fresh imports
		vi.resetModules()
	})

	describe('Initialisation tests', () => {
		it('initialises Firebase app with correct configuration', async () => {
			const { firebaseApp } = await import('../firebase.js')

			expect(initializeApp).toHaveBeenCalledWith({
				apiKey: 'test-api-key',
				authDomain: 'test-auth-domain',
				databaseURL: 'test-database-url',
				projectId: 'test-project-id',
				storageBucket: 'test-storage-bucket',
				messagingSenderId: 'test-messaging-sender-id',
				appId: 'test-app-id',
				measurementId: 'test-measurement-id',
			})

			expect(firebaseApp).toBe(mockApp)
		})

		it('exports firebaseApp instance', async () => {
			const { firebaseApp } = await import('../firebase.js')

			expect(firebaseApp).toBeDefined()
			expect(firebaseApp).toBe(mockApp)
		})
	})

	describe('Module caching tests', () => {
		it('calls initialiseApp only once', async () => {
			// First import
			// should call initialiseApp
			await import('../firebase.js')
			expect(initializeApp).toHaveBeenCalledTimes(1)

			// Second import
			// should not call again due to module caching
			await import('../firebase.js')
			expect(initializeApp).toHaveBeenCalledTimes(1)
		})
	})
})
