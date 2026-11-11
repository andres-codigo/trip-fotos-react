import { cypressArgs, serverSteps } from '../run-e2e.mjs'

describe('serverSteps', () => {
	it('builds and previews in emulators mode for emulator runs', () => {
		const { build, preview } = serverSteps({
			useEmulators: true,
			port: 5190,
			outDir: '/out',
		})
		expect(build).toEqual([
			'build',
			'--mode',
			'emulators',
			'--outDir',
			'/out',
			'--emptyOutDir',
		])
		expect(preview).toEqual([
			'preview',
			'--mode',
			'emulators',
			'--outDir',
			'/out',
			'--port',
			'5190',
			'--strictPort',
		])
	})

	it('builds in the default mode for live runs', () => {
		const { build, preview } = serverSteps({ useEmulators: false })
		expect(build).not.toContain('--mode')
		expect(preview).not.toContain('--mode')
	})

	it('never builds into dist/, which the Build gate writes', () =>
		expect(serverSteps({ useEmulators: true }).build.join(' ')).not.toMatch(
			/--outDir \S*\/dist\b/,
		))
})

describe('cypressArgs', () => {
	it('runs the whole suite without E2E_SPEC', () =>
		expect(cypressArgs(['--browser', 'chrome'], undefined)).toEqual([
			'run',
			'--e2e',
			'--browser',
			'chrome',
		]))

	it('runs only the specs in E2E_SPEC', () =>
		expect(
			cypressArgs([], 'cypress/e2e/a.cy.js,cypress/e2e/b.cy.js'),
		).toEqual([
			'run',
			'--e2e',
			'--spec',
			'cypress/e2e/a.cy.js,cypress/e2e/b.cy.js',
		]))
})
