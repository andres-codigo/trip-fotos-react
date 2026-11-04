import { describe, it, expect, afterEach, vi } from 'vitest'

// Mock redux-persist before importing store
const persistConfigs = vi.hoisted(() => [])

vi.mock('redux-persist', () => ({
	createTransform: vi.fn((inbound, outbound, config) => ({
		inbound,
		outbound,
		config,
	})),
	persistStore: vi.fn(() => ({ dispatch: vi.fn() })),
	persistReducer: vi.fn((config, reducer) => {
		persistConfigs.push(config)
		return reducer
	}),
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
		expect(state).toHaveProperty('messages')
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

	it('should have messages slice in store', () => {
		const state = store.getState()
		expect(state.messages).toBeDefined()
	})

	it('should drop lastFetch and uploadProgress from the travellers slice on rehydrate', () => {
		const [{ outbound, config }] = persistConfigs[0].transforms

		expect(config.whitelist).toEqual(['travellers'])
		expect(
			outbound({
				travellers: [],
				lastFetch: 123,
				uploadProgress: {
					uploadedFiles: 1,
					totalFiles: 3,
					percent: 40,
				},
			}),
		).toEqual({
			travellers: [],
			lastFetch: null,
			uploadProgress: null,
		})
	})

	it('should exclude messages from persistence', () => {
		expect(persistConfigs[0].blacklist).toContain('messages')
	})
})
