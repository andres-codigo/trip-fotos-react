import { describe, it, expect, vi, afterEach } from 'vitest'

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
		// Since persistStore is called during module initialization,
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
