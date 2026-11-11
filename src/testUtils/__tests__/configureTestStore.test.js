import { describe, it, expect, vi, beforeEach } from 'vitest'

const { configureStore } = vi.hoisted(() => ({ configureStore: vi.fn() }))

vi.mock('@reduxjs/toolkit', async (importOriginal) => {
	const actual = await importOriginal()
	configureStore.mockImplementation(actual.configureStore)
	return { ...actual, configureStore }
})

vi.mock('redux-persist', () => ({
	createTransform: vi.fn(() => ({})),
	persistStore: vi.fn(() => ({})),
	persistReducer: vi.fn((_, reducer) => reducer),
}))

import { middleware } from '@/store/middleware'
import configureTestStore from '@/testUtils/configureTestStore'

const reducer = { count: (state = 0) => state }

describe('configureTestStore', () => {
	beforeEach(() => {
		configureStore.mockClear()
	})

	it("uses the same middleware as the app's store", async () => {
		await import('@/store/store')
		const appOptions = configureStore.mock.calls.at(-1)[0]

		configureTestStore({ reducer })

		expect(appOptions.middleware).toBe(middleware)
		expect(configureStore.mock.calls.at(-1)[0].middleware).toBe(middleware)
	})

	it('passes the reducer and preloaded state through', () => {
		const store = configureTestStore({
			reducer,
			preloadedState: { count: 3 },
		})

		expect(store.getState()).toEqual({ count: 3 })
	})
})
