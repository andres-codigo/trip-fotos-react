import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
	BRANCH_LABEL,
	capturesDir,
	mergeBranchRecord,
	ranCaptures,
	readStamp,
	reuseVerdict,
	scriptHash,
	stampPath,
} from '../main-captures.mjs'
import { promote, promoteRecord } from '../promote.mjs'
import { CAPTURES } from '../../../../cypress/impact.js'

const TREE = 'a'.repeat(40)

describe('recording the branch captures', () => {
	const test = (id, state = 'passed') => ({
		title: ['UI check capture (branch)', CAPTURES[id].title],
		state,
	})

	it('names every capture a run started, failed ones too', () => {
		expect(
			ranCaptures({
				runs: [
					{
						tests: [
							test('own-trip'),
							test('edit-states', 'failed'),
						],
					},
				],
			}),
		).toEqual(['own-trip', 'edit-states'])
	})

	it('replaces the captures a run started and keeps the others', () => {
		const record = {
			captures: {
				'own-trip': { tree: 'old', widths: [390] },
				'edit-states': { tree: 'old', widths: [390] },
				'public-pages': { tree: 'old', widths: [390] },
			},
		}

		expect(
			mergeBranchRecord(record, {
				tree: TREE,
				ran: ['own-trip', 'edit-states'],
				captures: { 'own-trip': [390, 1280] },
			}),
		).toEqual({
			captures: {
				'public-pages': { tree: 'old', widths: [390] },
				'own-trip': { tree: TREE, widths: [390, 1280] },
			},
		})
	})
})

describe('promoting the branch captures', () => {
	const stamp = {
		commit: 'm'.repeat(40),
		script: 'hash',
		captures: { 'public-pages': [390], 'own-trip': [390] },
	}
	const record = {
		captures: {
			'own-trip': { tree: 'fresh', widths: [390, 1280] },
			'edit-states': { tree: 'older', widths: [390] },
			'messages-empty': { tree: 'gone', widths: [390] },
			'public-pages': { tree: 'shared', widths: [390] },
		},
	}
	const stale = {
		fresh: [],
		older: ['edit-states'],
		gone: undefined,
		shared: null,
	}

	it('promotes only the captures nothing has changed since', () => {
		const result = promoteRecord(stamp, record, (tree) => stale[tree])

		expect(result.promoted).toEqual(['own-trip'])
		expect(result.skipped).toEqual([
			'edit-states',
			'messages-empty',
			'public-pages',
		])
		expect(result.stamp).toEqual({
			...stamp,
			captures: { 'public-pages': [390], 'own-trip': [390, 1280] },
		})
	})
})

describe('promoting after a squash merge', () => {
	const PAGE = 'src/pages/privacy/Privacy.jsx'
	const SCRIPT_FILES = [
		'cypress/ui-check/capture.cy.js',
		'cypress/ui-check/selection.js',
		'cypress/impact.js',
		'cypress/support/utils/waitForSuccess.js',
		'scripts/seed-emulators.mjs',
	]
	let repo
	const git = (args) =>
		execSync(`git ${args}`, { cwd: repo, encoding: 'utf8' }).trim()
	const write = (file, text) => {
		fs.mkdirSync(path.dirname(path.resolve(repo, file)), {
			recursive: true,
		})
		fs.writeFileSync(path.resolve(repo, file), text)
	}
	const dir = () => capturesDir(repo)
	const shoot = (label, id) =>
		write(`${dir()}/${label}/${id}/shot-390.png`, id)
	const commit = (message) => git(`add -A && git commit -qm "${message}"`)

	beforeEach(() => {
		repo = fs.mkdtempSync(path.join(os.tmpdir(), 'promote-'))
		git('init -q -b main')
		git('config user.email test@example.com && git config user.name test')
		write('.gitignore', 'cypress/ui-check-captures/\n')
		for (const file of SCRIPT_FILES) write(file, '')
		write(PAGE, 'v1')
		write('src/app/App.jsx', 'v1')
		commit('base')
	})

	afterEach(() => fs.rmSync(repo, { recursive: true, force: true }))

	// The branch work, captured uncommitted, then squash-merged with `later` landing on main after it
	const mergeBranch = ({ later } = {}) => {
		git('switch -qc feature')
		write(PAGE, 'v2')
		const tree = git('add -A && git write-tree')
		write(
			stampPath(dir(), BRANCH_LABEL),
			JSON.stringify(
				mergeBranchRecord(null, {
					tree,
					ran: ['public-pages', 'own-trip'],
					captures: { 'public-pages': [390], 'own-trip': [390] },
				}),
			),
		)
		shoot('branch', 'public-pages')
		shoot('branch', 'own-trip')
		commit('feature')
		git('switch -q main && git merge -q --squash feature')
		commit('squash')
		if (later) {
			write(later, 'v3')
			commit('later')
		}
	}

	const verdict = (needed) =>
		reuseVerdict(readStamp(stampPath(dir())), {
			commit: git('rev-parse main'),
			script: scriptHash(repo),
			needed,
		})

	it('moves the branch captures into main, which then reuses them', () => {
		mergeBranch()

		expect(promote(repo)).toMatchObject({
			promoted: ['public-pages', 'own-trip'],
			deleted: [],
		})
		expect(fs.existsSync(`${dir()}/main/own-trip/shot-390.png`)).toBe(true)
		expect(fs.existsSync(`${dir()}/branch`)).toBe(false)
		expect(fs.existsSync(stampPath(dir(), BRANCH_LABEL))).toBe(false)
		expect(
			verdict({ 'public-pages': [390], 'own-trip': [390] }).reuse,
		).toBe(true)
	})

	it('leaves out a capture a later change it depends on can change', () => {
		mergeBranch({ later: PAGE })

		expect(promote(repo)).toMatchObject({
			promoted: ['own-trip'],
			deleted: ['public-pages'],
		})
		expect(fs.existsSync(`${dir()}/main/public-pages`)).toBe(false)
		expect(verdict({ 'public-pages': [390] }).retake).toEqual([
			'public-pages',
		])
	})

	it('promotes nothing after a change to a shared file', () => {
		mergeBranch({ later: 'src/app/App.jsx' })

		expect(promote(repo).promoted).toEqual([])
	})
})
