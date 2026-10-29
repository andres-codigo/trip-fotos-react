import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initializeApp } from 'firebase/app'
import {
	browserLocalPersistence,
	connectAuthEmulator,
	initializeAuth,
} from 'firebase/auth'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

vi.mock('firebase/app', () => ({
	initializeApp: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
	browserLocalPersistence: { type: 'LOCAL' },
	initializeAuth: vi.fn(() => ({ name: 'mock-auth' })),
	connectAuthEmulator: vi.fn(),
}))

vi.mock('firebase/storage', () => ({
	getStorage: vi.fn(() => ({ name: 'mock-storage' })),
	connectStorageEmulator: vi.fn(),
}))

const emulators = vi.hoisted(() => ({
	ENABLED: false,
	AUTH_URL: 'http://127.0.0.1:9099',
	STORAGE_HOST: '127.0.0.1',
	STORAGE_PORT: 9199,
}))

vi.mock('@/constants/firebase', () => ({
	FIREBASE_EMULATORS: emulators,
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
		vi.mocked(initializeAuth).mockClear()
		vi.mocked(connectAuthEmulator).mockClear()
		vi.mocked(connectStorageEmulator).mockClear()
		emulators.ENABLED = false
	})

	afterEach(() => {
		// Reset module registry to ensure fresh imports
		vi.resetModules()
	})

	describe('Initialisation tests', () => {
		it('does not initialise Auth on import', async () => {
			await import('@/services/firebase/firebase.js')

			expect(initializeAuth).not.toHaveBeenCalled()
		})

		it('returns the Auth instance for the initialised app', async () => {
			const { getFirebaseAuth } =
				await import('@/services/firebase/firebase.js')

			expect(getFirebaseAuth()).toEqual({ name: 'mock-auth' })
			expect(initializeAuth).toHaveBeenCalledWith(mockApp, {
				persistence: browserLocalPersistence,
			})
		})

		it('initialises Auth only once across calls', async () => {
			const { getFirebaseAuth } =
				await import('@/services/firebase/firebase.js')

			expect(getFirebaseAuth()).toBe(getFirebaseAuth())
			expect(initializeAuth).toHaveBeenCalledTimes(1)
		})

		it('initialises Auth before returning Storage so uploads carry the user token', async () => {
			const { getFirebaseStorage } =
				await import('@/services/firebase/firebase.js')

			expect(getFirebaseStorage()).toEqual({ name: 'mock-storage' })
			expect(initializeAuth).toHaveBeenCalled()
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

	describe('Emulator wiring', () => {
		it('does not connect the emulators when the flag is off', async () => {
			const { getFirebaseAuth, getFirebaseStorage } =
				await import('@/services/firebase/firebase.js')

			getFirebaseAuth()
			getFirebaseStorage()

			expect(connectAuthEmulator).not.toHaveBeenCalled()
			expect(connectStorageEmulator).not.toHaveBeenCalled()
		})

		it('connects the Auth emulator once when the flag is on', async () => {
			emulators.ENABLED = true
			const { getFirebaseAuth } =
				await import('@/services/firebase/firebase.js')

			getFirebaseAuth()
			getFirebaseAuth()

			expect(connectAuthEmulator).toHaveBeenCalledTimes(1)
			expect(connectAuthEmulator).toHaveBeenCalledWith(
				{ name: 'mock-auth' },
				'http://127.0.0.1:9099',
				{ disableWarnings: true },
			)
		})

		it('connects the Storage emulator once when the flag is on', async () => {
			emulators.ENABLED = true
			const { getFirebaseStorage } =
				await import('@/services/firebase/firebase.js')

			getFirebaseStorage()
			getFirebaseStorage()

			expect(connectStorageEmulator).toHaveBeenCalledTimes(1)
			expect(connectStorageEmulator).toHaveBeenCalledWith(
				{ name: 'mock-storage' },
				'127.0.0.1',
				9199,
			)
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
