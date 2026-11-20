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
import store from './store'

describe('Store Configuration', () => {
	afterEach(() => {
		vi.resetModules()
	})
	it('combines the authentication, travellers and messages slices', () => {
		expect(Object.keys(store.getState())).toEqual(
			expect.arrayContaining([
				'authentication',
				'travellers',
				'messages',
			]),
		)
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

	it('leaves the session to the Auth SDK, saving none of it', () => {
		expect(persistConfigs[0].blacklist).toContain('authentication')
	})

	it('drops a session saved before it was left out, keeping the rest', async () => {
		const saved = {
			authentication: { token: 'old-token', userId: 'u1' },
			travellers: { travellerName: 'Ada' },
			_persist: { version: -1, rehydrated: false },
		}

		const migrated = await persistConfigs[0].migrate(saved, -1)

		expect(migrated).toEqual({
			travellers: { travellerName: 'Ada' },
			_persist: { version: -1, rehydrated: false },
		})
		expect(saved).toHaveProperty('authentication')
	})

	it('migrates nothing when there is no saved state', async () => {
		await expect(persistConfigs[0].migrate(undefined, -1)).resolves.toBe(
			undefined,
		)
	})

	describe('immutableCheck warning limit', () => {
		// Each dispatch reads Date.now four times in the immutable check, so a step of n ms per read reports 2n ms
		const dispatchWithClockStep = (step) => {
			let now = 0
			const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
				now += step
				return now
			})
			const warnSpy = vi
				.spyOn(console, 'warn')
				.mockImplementation(() => {})

			store.dispatch({ type: 'test/clock-step' })

			const immutableWarnings = warnSpy.mock.calls.filter(([message]) =>
				String(message).includes('ImmutableStateInvariantMiddleware'),
			)
			nowSpy.mockRestore()
			warnSpy.mockRestore()
			return immutableWarnings
		}

		it('should not warn when a pass takes longer than the 32ms default but under 128ms', () => {
			expect(dispatchWithClockStep(30)).toHaveLength(0)
		})

		it('should warn when a pass takes longer than 128ms', () => {
			const warnings = dispatchWithClockStep(70)

			expect(warnings).toHaveLength(1)
			expect(warnings[0][0]).toContain('threshold of 128ms')
		})
	})
})
