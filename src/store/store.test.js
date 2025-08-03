import { describe, it, expect, vi } from 'vitest'
import store, { persistor } from './store'
import { persistStore } from 'redux-persist'

vi.mock('redux-persist', () => ({
	persistStore: vi.fn(() => ({ dispatch: vi.fn() })),
	persistReducer: vi.fn((config, reducer) => reducer),
}))

vi.mock('redux-persist/lib/storage', () => ({
	default: {},
}))

describe('Store Configuration', () => {
	it('should create store with correct initial state structure', () => {
		const state = store.getState()

		expect(state).toHaveProperty('authentication')
		expect(state).toHaveProperty('travellers')
	})

	it('should configure persistor', () => {
		expect(persistStore).toHaveBeenCalledWith(store)
		expect(persistor).toBeDefined()
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
