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
	const branch = ['src/a.js', '.claude/hooks/x.mjs']
	const cache = {
		gates: { lint: 't1', vitest: 't1', ct: 't1', build: 't1' },
	}
	const check = ({ tree = 't1', changed = [], ...rest } = {}) =>
		needsVerify({
			files: ['src/a.js'],
			branch,
			tree,
			cache,
			changedSince: () => changed,
			...rest,
		})

	it('passes when every gate passed on this tree', () =>
		expect(check()).toBe(false))

	it('passes when only files outside a gate changed since its pass', () =>
		expect(
			check({
				tree: 't2',
				changed: ['cypress/ui-check/capture.cy.js'],
				cache: {
					gates: { lint: 't2', vitest: 't1', ct: 't1', build: 't1' },
				},
			}),
		).toBe(false))

	it('blocks when a gate the change needs lapsed', () =>
		expect(check({ tree: 't2', changed: ['src/a.js'] })).toBe(true))

	it('blocks when nothing was recorded', () =>
		expect(check({ cache: {} })).toBe(true))

	it('leaves e2e to CI', () =>
		expect(check({ branch: ['src/pages/a.jsx'] })).toBe(false))

	it('exempts docs-only changes', () =>
		expect(
			check({ files: ['README.md', 'docs/ci-cd.md'], cache: {} }),
		).toBe(false))
})
