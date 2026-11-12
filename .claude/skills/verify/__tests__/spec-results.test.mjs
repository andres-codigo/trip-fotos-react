import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
	passedSpecs,
	readSpecResults,
	recordSpec,
	specsToRun,
	suiteSpecs,
} from '../spec-results.mjs'

const projectDir = path.resolve(import.meta.dirname, '../../../..')
const suite = ['a.cy.js', 'b.cy.js', 'c.cy.js']

describe('specsToRun', () => {
	it('runs the whole suite with nothing recorded', () =>
		expect(specsToRun({ suite, record: undefined, tree: 't1' })).toBeNull())

	it('reruns only the specs that have not passed on this tree', () =>
		expect(
			specsToRun({
				suite,
				record: { tree: 't1', passed: ['a.cy.js', 'c.cy.js'] },
				tree: 't1',
			}),
		).toEqual(['b.cy.js']))

	it('discards results from another tree', () =>
		expect(
			specsToRun({
				suite,
				record: { tree: 't0', passed: ['a.cy.js'] },
				tree: 't1',
			}),
		).toBeNull())

	it('keeps passes from an earlier tree when only specs it reruns changed since', () =>
		expect(
			specsToRun({
				suite,
				record: { tree: 't0', passed: ['a.cy.js', 'b.cy.js'] },
				tree: 't1',
				changed: ['b.cy.js'],
			}),
		).toEqual(['b.cy.js', 'c.cy.js']))

	it('discards an earlier tree when a file other than a spec changed since', () =>
		expect(
			specsToRun({
				suite,
				record: { tree: 't0', passed: ['a.cy.js'] },
				tree: 't1',
				changed: ['b.cy.js', 'src/components/ui/Badge.jsx'],
			}),
		).toBeNull())

	it('discards an earlier tree when git cannot tell what changed', () =>
		expect(
			specsToRun({
				suite,
				record: { tree: 't0', passed: ['a.cy.js'] },
				tree: 't1',
				changed: null,
			}),
		).toBeNull())

	it('runs the whole suite when no spec passed', () =>
		expect(
			specsToRun({
				suite,
				record: { tree: 't1', passed: [] },
				tree: 't1',
			}),
		).toBeNull())
})

describe('passedSpecs', () => {
	const results = [
		{ spec: 'b.cy.js', passed: true },
		{ spec: 'c.cy.js', passed: false },
	]

	it('adds this run’s passes to those already on the tree', () =>
		expect(
			passedSpecs({
				record: { tree: 't1', passed: ['a.cy.js'] },
				tree: 't1',
				results,
			}).sort(),
		).toEqual(['a.cy.js', 'b.cy.js']))

	it('drops passes recorded on another tree', () =>
		expect(
			passedSpecs({
				record: { tree: 't0', passed: ['a.cy.js'] },
				tree: 't1',
				results,
			}),
		).toEqual(['b.cy.js']))
})

describe('recordSpec', () => {
	let file

	beforeEach(() => {
		file = path.join(
			fs.mkdtempSync(path.join(os.tmpdir(), 'spec-results-')),
			'specs.ndjson',
		)
	})

	const stats = (failures) => ({ stats: { failures } })

	it('records each spec as passed or failed', () => {
		recordSpec({ relative: 'a.cy.js' }, stats(0), file)
		recordSpec({ relative: 'b.cy.js' }, stats(2), file)
		expect(readSpecResults(file)).toEqual([
			{ spec: 'a.cy.js', passed: true },
			{ spec: 'b.cy.js', passed: false },
		])
	})

	it('counts a spec that crashed before its tests ran as failed', () => {
		recordSpec(
			{ relative: 'a.cy.js' },
			{ ...stats(0), error: 'boom' },
			file,
		)
		recordSpec({ relative: 'b.cy.js' }, undefined, file)
		expect(readSpecResults(file).map(({ passed }) => passed)).toEqual([
			false,
			false,
		])
	})

	it('writes nothing outside /verify', () => {
		recordSpec({ relative: 'a.cy.js' }, stats(0), undefined)
		expect(fs.existsSync(file)).toBe(false)
	})
})

describe('suiteSpecs', () => {
	it('lists the E2E specs only', () => {
		const specs = suiteSpecs('e2e', projectDir)
		expect(specs.length).toBeGreaterThan(0)
		expect(specs.every((spec) => spec.startsWith('cypress/e2e/'))).toBe(
			true,
		)
	})

	it('lists component specs outside the E2E, live and capture folders', () => {
		const specs = suiteSpecs('ct', projectDir)
		expect(specs.length).toBeGreaterThan(0)
		expect(
			specs.some((spec) =>
				/^(node_modules|cypress\/(e2e|e2e-live|ui-check))\//.test(spec),
			),
		).toBe(false)
	})

	it('ignores folders named like specs, such as a failed spec’s screenshots', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'suite-'))
		fs.mkdirSync(path.join(dir, 'src'))
		fs.writeFileSync(path.join(dir, 'src', 'Button.cy.jsx'), '')
		fs.mkdirSync(
			path.join(dir, 'cypress', 'screenshots', 'Register.cy.js'),
			{
				recursive: true,
			},
		)
		fs.mkdirSync(path.join(dir, 'node_modules', 'pkg'), { recursive: true })
		fs.writeFileSync(path.join(dir, 'node_modules', 'pkg', 'x.cy.js'), '')
		expect(suiteSpecs('ct', dir)).toEqual(['src/Button.cy.jsx'])
	})
})
