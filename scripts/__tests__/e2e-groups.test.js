import { describe, expect, it } from 'vitest'

import { suiteSpecs } from '../../.claude/skills/verify/spec-results.mjs'
import {
	SPEC_SECONDS,
	UNKNOWN_SPEC_SECONDS,
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
})
