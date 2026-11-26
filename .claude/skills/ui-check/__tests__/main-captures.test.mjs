import { describe, expect, it } from 'vitest'

import {
	capturedWidths,
	mergeStamp,
	moveStamp,
	neededWidths,
	reuseVerdict,
	staleCaptures,
} from '../main-captures.mjs'
import { CAPTURES } from '../../../../cypress/impact.js'

const COMMIT = 'a'.repeat(40)
const stamp = {
	commit: COMMIT,
	script: 'script-hash',
	captures: {
		'public-pages': [390, 768, 1280],
		'edit-states': [390, 1280],
	},
}
const current = (needed, change = {}) => ({
	commit: COMMIT,
	script: 'script-hash',
	needed,
	...change,
})

describe('reusing the main captures', () => {
	it('reuses them when every needed capture was taken at its widths', () => {
		expect(
			reuseVerdict(stamp, current({ 'public-pages': [390, 1280] })),
		).toMatchObject({ reuse: true, retake: [] })
	})

	it.each([
		['nothing was recorded', null, {}, /no main capture/],
		[
			'main has moved',
			stamp,
			{ commit: 'b'.repeat(40) },
			/main moved from aaaaaaa to bbbbbbb/,
		],
		['the script changed', stamp, { script: 'other' }, /capture script/],
	])('retakes all of them when %s', (_, recorded, change, reason) => {
		const needed = { 'public-pages': [390], 'edit-states': [390] }
		const verdict = reuseVerdict(recorded, current(needed, change))

		expect(verdict.reuse).toBe(false)
		expect(verdict.reason).toMatch(reason)
		expect(verdict.retake).toEqual(['public-pages', 'edit-states'])
	})

	it('retakes only the captures missing or lacking a width', () => {
		const verdict = reuseVerdict(
			stamp,
			current({
				'public-pages': [390],
				'edit-states': [390, 768],
				'messages-empty': [390],
			}),
		)

		expect(verdict.reuse).toBe(false)
		expect(verdict.retake).toEqual(['edit-states', 'messages-empty'])
	})
})

describe('recording the main captures', () => {
	const results = (...tests) => ({ runs: [{ tests }] })
	const test = (id, state = 'passed') => ({
		title: ['UI check capture (main)', 'a context', CAPTURES[id].title],
		state,
	})

	it('records each passed capture with its widths, never a failed or skipped one', () => {
		expect(
			capturedWidths(
				results(
					test('public-pages'),
					test('edit-states'),
					test('messages-empty', 'failed'),
					test('own-trip', 'pending'),
				),
				'390,1280;edit=390,768,1280',
			),
		).toEqual({
			'public-pages': [390, 1280],
			'edit-states': [390, 768, 1280],
		})
	})

	it('adds a run on the same commit and script to the record', () => {
		const run = {
			commit: COMMIT,
			script: 'script-hash',
			captures: { 'edit-states': [390, 768] },
		}

		expect(mergeStamp(stamp, run).captures).toEqual({
			'public-pages': [390, 768, 1280],
			'edit-states': [390, 768],
		})
	})

	it('replaces the record after main or the script moved', () => {
		const run = {
			commit: 'b'.repeat(40),
			script: 'script-hash',
			captures: { 'edit-states': [390] },
		}

		expect(mergeStamp(stamp, run).captures).toEqual({
			'edit-states': [390],
		})
	})

	it('asks for every capture at the default widths, or the filtered ones at theirs', () => {
		const all = neededWidths(undefined, '')

		expect(Object.keys(all)).toEqual(Object.keys(CAPTURES))
		expect(all['public-pages']).toEqual([390, 1280])
		expect(neededWidths('390;edit-save=768', 'edit-save')).toEqual({
			'edit-save': [768],
		})
	})
})

describe('following main to a newer commit', () => {
	const pkg = (version, react = '^19.0.0') =>
		JSON.stringify({ name: 'trip-fotos', version, dependencies: { react } })
	const lock = (version) =>
		JSON.stringify({
			version,
			packages: { '': { version }, 'node_modules/react': {} },
		})
	const capture = (id, body) =>
		`\tcapture('${id}', () => {\n\t\t${body}\n\t})`
	const script = (...captures) =>
		`describe('UI check capture', () => {\n${captures.join('\n')}\n})\n`
	// Answers as narrowChange expects, from file contents before and after
	const repo = (before, after = {}) => ({
		isNew: (file) => !(file in before),
		before: (file) => before[file] ?? null,
		after: (file) => after[file] ?? null,
		diff: () => '',
	})

	it('keeps every capture after a release commit', () => {
		const files = [
			'CHANGELOG.md',
			'package.json',
			'package-lock.json',
			'config/release-please-manifest.json',
		]
		const git = repo(
			{
				'package.json': pkg('0.28.7'),
				'package-lock.json': lock('0.28.7'),
			},
			{
				'package.json': pkg('0.28.8'),
				'package-lock.json': lock('0.28.8'),
			},
		)

		expect(staleCaptures(files, git)).toEqual([])
	})

	it.each([
		['docs and tests', ['README.md', 'src/app/__tests__/App.test.jsx']],
		['an E2E spec', ['cypress/e2e/pages/Authentication.cy.js']],
		['a README in src', ['src/constants/README.md']],
		[
			'public files no page shows',
			['public/sitemap.xml', 'public/icon.svg'],
		],
	])('keeps every capture after %s', (_, files) => {
		expect(staleCaptures(files, repo({}))).toEqual([])
	})

	it('keeps every capture after an npm script change', () => {
		const withScript = (script) =>
			JSON.stringify({
				...JSON.parse(pkg('0.28.7')),
				scripts: { script },
			})
		const git = repo(
			{ 'package.json': withScript('vite') },
			{ 'package.json': withScript('vite --open') },
		)

		expect(staleCaptures(['package.json'], git)).toEqual([])
	})

	describe('after a vite.config.js change', () => {
		const config = (workers) =>
			`export default {\n\tbuild: {\n\t\tminify: true,\n\t},\n\ttest: {\n\t\tmaxWorkers: ${workers},\n\t},\n}\n`
		const vite = (before, after, diff) => ({
			...repo({ 'vite.config.js': before }, { 'vite.config.js': after }),
			diff: () => diff,
		})

		it('keeps every capture when only the Vitest test block changed', () => {
			const git = vite(
				config(2),
				config(4),
				'@@ -6 +6 @@\n-\t\tmaxWorkers: 2,\n+\t\tmaxWorkers: 4,',
			)

			expect(staleCaptures(['vite.config.js'], git)).toEqual([])
		})

		it('retakes every capture when the build changed', () => {
			const git = vite(
				config(2),
				config(2).replace('minify: true', 'minify: false'),
				'@@ -3 +3 @@\n-\t\tminify: true,\n+\t\tminify: false,',
			)

			expect(staleCaptures(['vite.config.js'], git)).toBeNull()
		})
	})

	it('retakes only the captures an area maps to', () => {
		const stale = staleCaptures(
			['src/pages/privacy/Privacy.jsx'],
			repo({ 'src/pages/privacy/Privacy.jsx': '' }),
		)

		expect(stale).toEqual(['public-pages'])
	})

	it('retakes only the capture whose body changed', () => {
		const file = 'cypress/ui-check/capture.cy.js'
		const git = repo(
			{
				[file]: script(
					capture('public-pages', 'a()'),
					capture('own-trip', 'b()'),
				),
			},
			{
				[file]: script(
					capture('public-pages', 'a()'),
					capture('own-trip', 'c()'),
				),
			},
		)

		expect(staleCaptures([file], git)).toEqual(['own-trip'])
	})

	it.each([
		['a shared file', ['src/app/App.jsx'], { 'src/app/App.jsx': '' }, {}],
		['the selection helper', ['cypress/ui-check/selection.js'], {}, {}],
		['the seed data', ['scripts/seed-emulators.mjs'], {}, {}],
		['the HTML shell', ['index.html'], {}, {}],
		['the fonts', ['public/fonts/Roboto-Regular.woff2'], {}, {}],
		[
			'shared capture setup',
			['cypress/ui-check/capture.cy.js'],
			{
				'cypress/ui-check/capture.cy.js': script(
					capture('own-trip', 'b()'),
				),
			},
			{
				'cypress/ui-check/capture.cy.js': `beforeEach(() => reset())\n${script(capture('own-trip', 'b()'))}`,
			},
		],
		[
			'a dependency bump',
			['package.json'],
			{ 'package.json': pkg('0.28.7') },
			{ 'package.json': pkg('0.28.8', '^19.1.0') },
		],
	])('retakes every capture after %s', (_, files, before, after) => {
		expect(staleCaptures(files, repo(before, after))).toBeNull()
	})

	it('moves the record to the new commit without the stale captures', () => {
		expect(
			moveStamp(stamp, {
				commit: 'b'.repeat(40),
				script: 'new-hash',
				stale: ['edit-states'],
			}),
		).toEqual({
			commit: 'b'.repeat(40),
			script: 'new-hash',
			captures: { 'public-pages': [390, 768, 1280] },
		})
		expect(
			moveStamp(stamp, {
				commit: 'b'.repeat(40),
				script: 'x',
				stale: null,
			}).captures,
		).toEqual({})
	})

	it('then retakes just the dropped captures', () => {
		const moved = moveStamp(stamp, {
			commit: 'b'.repeat(40),
			script: 'script-hash',
			stale: ['edit-states'],
		})
		const verdict = reuseVerdict(
			moved,
			current(
				{ 'public-pages': [390], 'edit-states': [390] },
				{ commit: 'b'.repeat(40) },
			),
		)

		expect(verdict.retake).toEqual(['edit-states'])
	})
})
