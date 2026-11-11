import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
	cypressArgs,
	fatalLine,
	serverSteps,
	specBatches,
	watchEmulatorLogs,
} from '../run-e2e.mjs'

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

describe('specBatches', () => {
	const suite = ['a.cy.js', 'b.cy.js', 'c.cy.js']

	it('runs the affected specs first, then the rest of the suite', () =>
		expect(specBatches({ first: 'c.cy.js', suite })).toEqual([
			'c.cy.js',
			'a.cy.js,b.cy.js',
		]))

	it('keeps to E2E_SPEC when /verify reruns only failed specs', () =>
		expect(
			specBatches({
				first: 'c.cy.js,a.cy.js',
				spec: 'b.cy.js,c.cy.js',
				suite,
			}),
		).toEqual(['c.cy.js', 'b.cy.js']))

	it('runs one batch when nothing is affected, or everything is', () => {
		expect(specBatches({ suite })).toEqual([null])
		expect(
			specBatches({ first: 'a.cy.js,b.cy.js,c.cy.js', suite }),
		).toEqual([null])
		expect(
			specBatches({ first: 'a.cy.js', spec: 'b.cy.js', suite }),
		).toEqual(['b.cy.js'])
	})
})

describe('fatalLine', () => {
	it('finds a Storage rules crash or an exited emulator', () => {
		expect(
			fatalLine(
				'[debug] ok\n[warn] Unexpected rules runtime error: Path segment cannot be empty\nmore',
			),
		).toBe(
			'[warn] Unexpected rules runtime error: Path segment cannot be empty',
		)
		expect(fatalLine('Storage Emulator has exited with code: 1')).toMatch(
			/has exited/,
		)
	})

	it('ignores ordinary log lines', () =>
		expect(fatalLine('[debug] GET /v0/b/x/o 200\n')).toBe(null))
})

describe('watchEmulatorLogs', () => {
	let dir
	let stop

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-e2e-logs-'))
	})

	afterEach(() => {
		stop?.()
		fs.rmSync(dir, { recursive: true, force: true })
	})

	const fatal = () =>
		new Promise((resolve) => {
			stop = watchEmulatorLogs({ dir, onFatal: resolve, interval: 10 })
		})

	it('reports a fatal line written after the watch starts', async () => {
		const log = path.join(dir, 'firebase-debug.log')
		fs.writeFileSync(log, 'started\n')
		const reported = fatal()

		fs.appendFileSync(log, 'Unexpected rules runtime error: boom\n')

		await expect(reported).resolves.toMatch(/boom/)
	})

	it('watches a log created after it starts', async () => {
		const reported = fatal()

		fs.writeFileSync(
			path.join(dir, 'firebase-debug.1.log'),
			'Database Emulator has exited with code: 1\n',
		)

		await expect(reported).resolves.toMatch(/has exited/)
	})

	it('ignores a crash already in the log from an earlier run', async () => {
		fs.writeFileSync(
			path.join(dir, 'firebase-debug.log'),
			'Unexpected rules runtime error: old\n',
		)
		let reported = null
		stop = watchEmulatorLogs({
			dir,
			onFatal: (line) => (reported = line),
			interval: 10,
		})

		await new Promise((resolve) => setTimeout(resolve, 50))

		expect(reported).toBe(null)
	})
})
