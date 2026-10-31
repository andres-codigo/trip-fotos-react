import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { resetChecks } from '../reset-checks.mjs'

describe('resetChecks', () => {
	let dir
	const file = (...parts) =>
		path.join(dir, 'node_modules', '.cache', ...parts)

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reset-checks-'))
		for (const f of [
			file('verify', 'status.json'),
			file('verify', 'passed.json'),
			file('ui-check', 'status.json'),
		]) {
			fs.mkdirSync(path.dirname(f), { recursive: true })
			fs.writeFileSync(f, '{}')
		}
	})

	afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

	it('clears both status files and keeps the passed-gates cache by default', () => {
		resetChecks(dir)

		expect(fs.existsSync(file('verify', 'status.json'))).toBe(false)
		expect(fs.existsSync(file('ui-check', 'status.json'))).toBe(false)
		expect(fs.existsSync(file('verify', 'passed.json'))).toBe(true)
	})

	it('also clears the passed-gates cache after a merge', () => {
		resetChecks(dir, { cache: true })

		expect(fs.existsSync(file('verify', 'passed.json'))).toBe(false)
	})

	it('does not fail when nothing has been recorded', () => {
		resetChecks(dir, { cache: true })

		expect(() => resetChecks(dir, { cache: true })).not.toThrow()
	})
})
