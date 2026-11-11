import { vi } from 'vitest'

import { findClash, recordGate, scheduleGates } from '../verify.mjs'

describe('findClash', () => {
	const quiet = {
		status: {},
		alive: () => true,
		inUse: async () => false,
		cypressRunning: () => false,
	}

	it('allows a run when nothing clashes', async () =>
		expect(await findClash(quiet)).toBeNull())

	it('refuses while another /verify is alive', async () =>
		expect(
			await findClash({
				...quiet,
				status: { state: 'running', pid: 42 },
			}),
		).toMatch(/another \/verify is running \(pid 42\)/))

	it('ignores a running state left by a stopped run', async () =>
		expect(
			await findClash({
				...quiet,
				status: { state: 'running', pid: 42 },
				alive: () => false,
			}),
		).toBeNull())

	it('refuses while the emulators hold their ports', async () =>
		expect(
			await findClash({ ...quiet, inUse: async (port) => port === 9099 }),
		).toMatch(/emulator ports in use \(9099\)/))

	it('refuses while a Cypress run is in progress', async () =>
		expect(
			await findClash({ ...quiet, cypressRunning: () => true }),
		).toMatch(/Cypress run is in progress/))
})

describe('scheduleGates', () => {
	// Each gate resolves when the test releases it, so the order of starts can be checked
	const harness = (statuses = {}) => {
		const started = []
		const release = {}
		const start = (gate) =>
			new Promise((resolve) => {
				started.push(gate)
				release[gate] = () => resolve({ status: statuses[gate] ?? 0 })
			})
		return { started, release, start }
	}
	const tick = () => new Promise((resolve) => setTimeout(resolve))

	it('runs the fast gates together, then the component tests, with no E2E', async () => {
		const { started, release, start } = harness()
		const done = scheduleGates(
			['lint', 'vitest', 'ct', 'build', 'yaml'],
			start,
			() => {},
		)
		await tick()
		expect(started.sort()).toEqual(['build', 'lint', 'vitest', 'yaml'])
		;['lint', 'vitest', 'build', 'yaml'].forEach((gate) => release[gate]())
		await tick()
		expect(started).toContain('ct')
		release.ct()
		expect(Object.keys(await done)).toHaveLength(5)
	})

	it('runs the component tests alone, then E2E alongside the fast gates', async () => {
		const { started, release, start } = harness()
		const done = scheduleGates(
			['lint', 'vitest', 'ct', 'e2e'],
			start,
			() => {},
		)
		await tick()
		expect(started).toEqual(['ct'])
		release.ct()
		await tick()
		expect(started.sort()).toEqual(['ct', 'e2e', 'lint', 'vitest'])
		;['lint', 'vitest', 'e2e'].forEach((gate) => release[gate]())
		expect(Object.keys(await done)).toHaveLength(4)
	})

	it('stops the other gates when ESLint cannot run', async () => {
		const { started, release, start } = harness({ lint: 2 })
		const stop = vi.fn()
		const done = scheduleGates(['lint', 'vitest', 'ct'], start, stop)
		await tick()
		release.lint()
		release.vitest()
		await done
		expect(stop).toHaveBeenCalledOnce()
		// Never started after ESLint failed to run
		expect(started).not.toContain('ct')
	})

	it('lets the other gates run when ESLint only finds problems', async () => {
		const { release, start } = harness({ lint: 1 })
		const stop = vi.fn()
		const done = scheduleGates(['lint', 'vitest'], start, stop)
		await tick()
		release.lint()
		release.vitest()
		await done
		expect(stop).not.toHaveBeenCalled()
	})
})

describe('recordGate', () => {
	const setup = () => ({
		cache: { gates: { e2e: 'old-tree' } },
		specRecords: {},
		gate: 'e2e',
		tree: 'new-tree',
	})

	it('records a pass on this tree and forgets its spec results', () => {
		const state = setup()
		state.specRecords.e2e = { tree: 'new-tree', passed: ['a.cy.js'] }
		recordGate({ ...state, status: 0 })
		expect(state.cache.gates.e2e).toBe('new-tree')
		expect(state.specRecords.e2e).toBeUndefined()
	})

	it('drops an older pass when the gate fails on this tree', () => {
		const state = setup()
		recordGate({ ...state, status: 1, specResults: [] })
		expect(state.cache.gates.e2e).toBeUndefined()
	})

	it('keeps the specs that passed in a failed run', () => {
		const state = setup()
		recordGate({
			...state,
			status: 1,
			specResults: [
				{ spec: 'a.cy.js', passed: true },
				{ spec: 'b.cy.js', passed: false },
			],
		})
		expect(state.specRecords.e2e).toEqual({
			tree: 'new-tree',
			passed: ['a.cy.js'],
		})
	})

	it('records no specs for a gate without them', () => {
		const state = { ...setup(), gate: 'vitest' }
		recordGate({ ...state, status: 1 })
		expect(state.specRecords).toEqual({})
	})
})
