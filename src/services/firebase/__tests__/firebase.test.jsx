import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

vi.mock('firebase/app', () => ({
	initializeApp: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
	getAuth: vi.fn(() => ({ name: 'mock-auth' })),
}))

vi.mock('firebase/storage', () => ({
	getStorage: vi.fn(() => ({ name: 'mock-storage' })),
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
	},
}))

describe('Firebase Configuration', () => {
	let mockApp

	beforeEach(() => {
		// Only clear return values,
		// not call history for the "calls initializeApp only once" test
		mockApp = { name: '[DEFAULT]' }
		vi.mocked(initializeApp).mockReturnValue(mockApp)
		vi.mocked(getAuth).mockClear()
	})

	afterEach(() => {
		// Reset module registry to ensure fresh imports
		vi.resetModules()
	})

	describe('Initialisation tests', () => {
		it('does not initialise Auth on import', async () => {
			await import('@/services/firebase/firebase.js')

			expect(getAuth).not.toHaveBeenCalled()
		})

		it('returns the Auth instance for the initialised app', async () => {
			const { getFirebaseAuth } =
				await import('@/services/firebase/firebase.js')

			expect(getFirebaseAuth()).toEqual({ name: 'mock-auth' })
			expect(getAuth).toHaveBeenCalledWith(mockApp)
		})

		it('initialises Auth before returning Storage so uploads carry the user token', async () => {
			const { getFirebaseStorage } =
				await import('@/services/firebase/firebase.js')

			expect(getFirebaseStorage()).toEqual({ name: 'mock-storage' })
			expect(getAuth).toHaveBeenCalledWith(mockApp)
			expect(getStorage).toHaveBeenCalledWith(mockApp)
		})

		it('initialises Firebase app with correct configuration', async () => {
			const { firebaseApp } =
				await import('@/services/firebase/firebase.js')

			expect(initializeApp).toHaveBeenCalledWith({
				apiKey: 'test-api-key',
				authDomain: 'test-auth-domain',
				databaseURL: 'test-database-url',
				projectId: 'test-project-id',
				storageBucket: 'test-storage-bucket',
				messagingSenderId: 'test-messaging-sender-id',
				appId: 'test-app-id',
			})

			expect(firebaseApp).toBe(mockApp)
		})

		it('exports firebaseApp instance', async () => {
			const { firebaseApp } =
				await import('@/services/firebase/firebase.js')

			expect(firebaseApp).toBeDefined()
			expect(firebaseApp).toBe(mockApp)
		})
	})

	describe('Module caching tests', () => {
		it('calls initialiseApp only once', async () => {
			// First import
			// should call initialiseApp
			await import('@/services/firebase/firebase.js')
			expect(initializeApp).toHaveBeenCalledTimes(1)

			// Second import
			// should not call again due to module caching
			await import('@/services/firebase/firebase.js')
			expect(initializeApp).toHaveBeenCalledTimes(1)
		})
	})
})
