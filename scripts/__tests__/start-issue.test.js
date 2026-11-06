import fs from 'node:fs'
import path from 'node:path'

import { vi } from 'vitest'

import {
	branchName,
	doAfterNumbers,
	kindFor,
	intakeWait,
	parseTitle,
	relabel,
	waitForItem,
} from '../start-issue.mjs'

describe('start-issue helpers', () => {
	it.each([
		['feat: add a thing', 'feature'],
		['fix(auth): redirect loop', 'fix'],
		['perf: faster', 'fix'],
		['chore: bump', 'chore'],
		['not conventional', null],
	])('maps the prefix of %j', (title, prefix) => {
		expect(parseTitle(title).prefix).toBe(prefix)
	})

	it('picks the board Kind from the title prefix', () => {
		expect(kindFor('test: x')).toBe('Test')
		expect(kindFor('fix: x')).toBe('Bug')
		expect(kindFor('whatever')).toBeNull()
	})

	it('builds a short prefixed branch name', () => {
		expect(
			branchName(
				'test: replace class-name and prop assertions with role and data-cy assertions',
			),
		).toBe('test/replace-class-name-and-prop-assertions')
		expect(branchName('no prefix here')).toBe('chore/no-prefix-here')
	})

	it('treats every number before "before" as a blocker and keeps the rest apart', () => {
		expect(doAfterNumbers('Do after: #374 (a), before #383 (b).')).toEqual({
			blockers: [374],
			afterBefore: [383],
		})
		expect(doAfterNumbers('Do after #1 and #2.')).toEqual({
			blockers: [1, 2],
			afterBefore: [],
		})
		expect(doAfterNumbers('No dependency line')).toEqual({
			blockers: [],
			afterBefore: [],
		})
	})

	describe('intakeWait', () => {
		const created = '2026-11-06T03:36:14Z'
		const at = (seconds) => new Date(created).getTime() + seconds * 1000

		it('waits out the rest of Intake’s window for a new issue', () => {
			expect(intakeWait(created, at(20))).toBe(45_000)
		})

		it('does not wait once the issue is past the window', () => {
			expect(intakeWait(created, at(65))).toBe(0)
			expect(intakeWait(created, at(600))).toBe(0)
		})
	})

	describe('relabel', () => {
		it('removes a label the bot added after start-up before adding it', () => {
			const edit = vi.fn()

			relabel(() => [{ name: 'fix' }], 'fix', edit)

			expect(edit.mock.calls).toEqual([
				['--remove-label', 'fix'],
				['--add-label', 'fix'],
			])
		})

		it('only adds a label that is not there', () => {
			const edit = vi.fn()

			relabel(() => [{ name: 'other' }], 'fix', edit)

			expect(edit.mock.calls).toEqual([['--add-label', 'fix']])
		})
	})

	describe('waitForItem', () => {
		const other = { id: 'A', content: { number: 1 } }
		const target = { id: 'B', content: { number: 639 } }

		it('re-reads the item list until a just-created issue appears', async () => {
			const reads = [[other], [other], [other, target]]
			const readItems = vi.fn(() => reads.shift())
			const wait = vi.fn(async () => {})

			const { item, items } = await waitForItem(readItems, 639, { wait })

			expect(item).toBe(target)
			expect(items).toEqual([other, target])
			expect(readItems).toHaveBeenCalledTimes(3)
			expect(wait).toHaveBeenCalledTimes(2)
		})

		it('reads once when the issue is already listed', async () => {
			const readItems = vi.fn(() => [other, target])
			const wait = vi.fn(async () => {})

			expect((await waitForItem(readItems, 639, { wait })).item).toBe(
				target,
			)
			expect(wait).not.toHaveBeenCalled()
		})

		it('gives up with no item after the last attempt', async () => {
			const readItems = vi.fn(() => [other])
			const wait = vi.fn(async () => {})

			const { item } = await waitForItem(readItems, 639, {
				attempts: 2,
				wait,
			})

			expect(item).toBeUndefined()
			expect(readItems).toHaveBeenCalledTimes(3)
		})
	})
})

// The allow list approves `node scripts/start-issue.mjs *`, not what the file does, so CI pins what it may run.
// Adding a command here is a deliberate, reviewed change.
describe('start-issue script guard', () => {
	const source = fs.readFileSync(
		path.resolve(__dirname, '../start-issue.mjs'),
		'utf8',
	)

	const calls = () => {
		const found = new Set()
		for (const m of source.matchAll(
			/\b(gh|git|json)\(\s*'([^']+)'(?:,\s*'([^']+)')?/g,
		)) {
			found.add([m[1], m[2], m[3]].filter(Boolean).join(' '))
		}
		return [...found].sort()
	}

	it('runs only the pinned gh and git commands', () => {
		expect(calls()).toEqual(
			[
				'gh issue edit',
				'gh pr create',
				'gh project item-edit',
				'gh workflow run',
				'git branch --show-current',
				'git commit --allow-empty',
				'git push -u',
				'git status --porcelain',
				'git switch -c',
				'json api',
				'json issue view',
				'json project field-list',
				'json project item-list',
			].sort(),
		)
	})

	it('only reads the blocked_by endpoint through gh api', () => {
		const api = source.match(/'api',\s*`([^`]+)`/g)
		expect(api).toHaveLength(1)
		expect(api[0]).toMatch(
			/issues\/\$\{number\}\/dependencies\/blocked_by`$/,
		)
	})

	it.each([
		'--force',
		'--force-with-lease',
		'--method',
		'-X',
		'--repo',
		"'-R'",
		'--delete',
		'--admin',
		"'merge'",
		"'close'",
		"'reset'",
		"'rm'",
		'shell:',
		'spawn',
		'execSync',
		'fetch(',
		'eval(',
		'process.env',
	])('does not contain %s', (needle) => {
		expect(source).not.toContain(needle)
	})

	it('makes no network call of its own and never runs a shell command', () => {
		expect(source).not.toMatch(/(?<![.\w])exec\(/)
		// The only URLs allowed are the attribution link in the PR body and the file: check that the script was run directly
		const withoutAttribution = source
			.replace('https://claude.com/claude-code', '')
			.replace('`file://${process.argv[1]}`', '')
		expect(withoutAttribution).not.toContain('://')
	})

	it('imports nothing beyond execFileSync', () => {
		expect(
			[...source.matchAll(/^import .* from '(.+)'$/gm)].map((m) => m[1]),
		).toEqual(['node:child_process'])
	})
})
