import fs from 'node:fs'
import path from 'node:path'

import {
	branchName,
	doAfterNumbers,
	kindFor,
	parseTitle,
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

	it('reads only the issues named after "Do after"', () => {
		expect(doAfterNumbers('Do after: #374 (a), before #383 (b).')).toEqual([
			374,
		])
		expect(doAfterNumbers('Do after #1 and #2.')).toEqual([1, 2])
		expect(doAfterNumbers('No dependency line')).toEqual([])
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
