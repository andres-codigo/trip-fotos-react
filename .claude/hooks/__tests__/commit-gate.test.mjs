import { isCommit, needsVerify } from '../commit-gate.mjs'

describe('isCommit', () => {
	it.each([
		'git commit -m "x"',
		'git add -A && git commit -m x',
		'git -C . commit --amend',
		'cd a; git commit',
	])('flags %j', (command) => expect(isCommit(command)).toBe(true))

	it.each([
		'git log --oneline',
		'echo "git commit"',
		'git status',
		'gh pr view',
	])('ignores %j', (command) => expect(isCommit(command)).toBe(false))
})

describe('needsVerify', () => {
	const cache = { tree: 't1', passed: ['lint'] }

	it('passes when the tree matches a recorded run', () =>
		expect(needsVerify({ files: ['src/a.js'], tree: 't1', cache })).toBe(
			false,
		))

	it('blocks when the tree changed since the run', () =>
		expect(needsVerify({ files: ['src/a.js'], tree: 't2', cache })).toBe(
			true,
		))

	it('blocks when nothing was recorded', () =>
		expect(
			needsVerify({ files: ['src/a.js'], tree: 't1', cache: {} }),
		).toBe(true))

	it('exempts docs-only changes', () =>
		expect(
			needsVerify({
				files: ['README.md', 'docs/ci-cd.md'],
				tree: 't2',
				cache: {},
			}),
		).toBe(false))
})
