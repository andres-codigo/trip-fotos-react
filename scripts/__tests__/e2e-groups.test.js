import { describe, expect, it } from 'vitest'

import { suiteSpecs } from '../../.claude/skills/verify/spec-results.mjs'
import {
	MAX_GROUPS,
	SPEC_SECONDS,
	UNKNOWN_SPEC_SECONDS,
	planMatrix,
	planSpecs,
	splitSpecs,
} from '../e2e-groups.mjs'

const suite = suiteSpecs('e2e', process.cwd())

describe('e2e-groups', () => {
	it('records a time for every E2E spec and none that has gone', () => {
		expect(Object.keys(SPEC_SECONDS).sort()).toEqual([...suite].sort())
	})

	it('puts every spec in exactly one group', () => {
		const groups = splitSpecs(suite, 3)
		expect(groups.flatMap(({ specs }) => specs).sort()).toEqual(
			[...suite].sort(),
		)
	})

	it('keeps the slowest group within the longest spec of the lightest', () => {
		const seconds = splitSpecs(suite, 3).map((group) => group.seconds)
		const longest = Math.max(...Object.values(SPEC_SECONDS))
		expect(Math.max(...seconds) - Math.min(...seconds)).toBeLessThanOrEqual(
			longest,
		)
	})

	it('splits the same way whatever order the specs arrive in', () => {
		expect(splitSpecs([...suite].reverse(), 3)).toEqual(
			splitSpecs(suite, 3),
		)
	})

	it('runs a spec with no recorded time, weighted as an average one', () => {
		const groups = splitSpecs(['cypress/e2e/pages/New.cy.js'], 2)
		expect(groups[0]).toEqual({
			specs: ['cypress/e2e/pages/New.cy.js'],
			seconds: UNKNOWN_SPEC_SECONDS,
		})
		expect(groups[1].specs).toEqual([])
	})

	describe('planSpecs', () => {
		it('runs every spec on main and manual runs', () => {
			expect(planSpecs(null, suite).specs).toEqual(suite)
		})

		it('runs only the specs for a page a PR touches', () => {
			expect(
				planSpecs(['src/pages/page-not-found/PageNotFound.jsx'], suite)
					.specs,
			).toEqual(['cypress/e2e/pages/PageNotFound.cy.js'])
		})

		it('runs a changed spec impact.js does not name yet', () => {
			const spec = 'cypress/e2e/pages/New.cy.js'
			expect(planSpecs([spec], [...suite, spec]).specs).toEqual([spec])
		})

		it.each([
			'src/store/databaseRequest.js',
			'src/components/layout/header/Header.jsx',
			'cypress/support/commands.js',
			'cypress/fixtures/travellers.json',
			'scripts/seed-emulators.mjs',
			'scripts/e2e-groups.mjs',
			'index.html',
			'public/site.webmanifest',
			'firebase/database.rules.json',
			'package-lock.json',
			'.github/workflows/cypress-e2e.yml',
			'.claude/skills/verify/run-e2e.mjs',
		])('runs every spec when %s changes', (file) => {
			const plan = planSpecs(
				['src/pages/page-not-found/PageNotFound.jsx', file],
				suite,
			)
			expect(plan.specs).toEqual(suite)
			expect(plan.reason).toMatch(/^every spec/)
		})

		it('runs no spec for tests, captures and files outside the app', () => {
			expect(
				planSpecs(
					[
						'src/pages/page-not-found/__tests__/PageNotFound.test.jsx',
						'scripts/__tests__/e2e-groups.test.js',
						'cypress/ui-check/capture.cy.js',
						'cypress/e2e-live/LiveSmoke.cy.js',
						'scripts/start-issue.mjs',
						'scripts/set-admin-claim.mjs',
						'docs/ci-cd.md',
					],
					suite,
				).specs,
			).toEqual([])
		})
	})

	describe('planMatrix', () => {
		it('runs a short plan in one group', () => {
			expect(
				planMatrix(['cypress/e2e/pages/PageNotFound.cy.js']),
			).toEqual([
				{
					group: 1,
					count: 1,
					specs: 'cypress/e2e/pages/PageNotFound.cy.js',
				},
			])
		})

		it('splits the full suite across the most groups, none empty', () => {
			const matrix = planMatrix(suite)
			expect(matrix).toHaveLength(MAX_GROUPS)
			expect(matrix.every(({ specs }) => specs.length)).toBe(true)
			expect(matrix.every(({ count }) => count === MAX_GROUPS)).toBe(true)
		})

		it('plans no group when no spec runs', () => {
			expect(planMatrix([])).toEqual([])
		})
	})
})
