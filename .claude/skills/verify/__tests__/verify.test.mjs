import { findClash } from '../verify.mjs'

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
