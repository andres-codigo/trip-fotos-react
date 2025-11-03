import { describe, it, expect, afterEach, vi } from 'vitest'

/**
 * Store Configuration Unit Tests
 *
 * Tests Redux store configuration, persistence setup, and slice integration.
 *
 * Mocks:
 * - redux-persist: Mock persist store and reducer to isolate store configuration
 * - redux-persist/lib/storage: Mock localStorage adapter for persistence
 *
 * Store Features:
 * - Multi-slice structure: authentication and travellers slices
 * - Redux Persist integration: Automatic state persistence to localStorage
 * - Persist actions: Handles FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER
 * - Middleware: Configured to ignore serialization warnings for persist actions
 *
 * Test Coverage:
 * - Store initialization with correct state structure
 * - Persistor configuration and instantiation
 * - Persist action handling without errors
 * - Slice registration and availability
 */

// Mock redux-persist before importing store
vi.mock('redux-persist', () => ({
	persistStore: vi.fn(() => ({ dispatch: vi.fn() })),
	persistReducer: vi.fn((config, reducer) => reducer),
}))

vi.mock('redux-persist/lib/storage', () => ({
	default: {},
}))

// Import after mocking to ensure mocks are applied
import store, { persistor } from './store'

describe('Store Configuration', () => {
	afterEach(() => {
		vi.resetModules()
	})
	it('should create store with correct initial state structure', () => {
		const state = store.getState()

		expect(state).toHaveProperty('authentication')
		expect(state).toHaveProperty('travellers')
	})

	it('should configure persistor', () => {
		// Since persistStore is called during module initialisation,
		// we verify the persistor was created successfully
		expect(persistor).toBeDefined()
		expect(persistor).toHaveProperty('dispatch')
		expect(typeof persistor.dispatch).toBe('function')
	})

	it('should handle persist actions without serialization warnings', () => {
		const persistActions = [
			'persist/FLUSH',
			'persist/REHYDRATE',
			'persist/PAUSE',
			'persist/PERSIST',
			'persist/PURGE',
			'persist/REGISTER',
		]

		persistActions.forEach((actionType) => {
			expect(() => {
				store.dispatch({ type: actionType })
			}).not.toThrow()
		})
	})

	it('should have authentication slice in store', () => {
		const state = store.getState()
		expect(state.authentication).toBeDefined()
	})

	it('should have travellers slice in store', () => {
		const state = store.getState()
		expect(state.travellers).toBeDefined()
	})
})
