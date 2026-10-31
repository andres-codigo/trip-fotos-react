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
