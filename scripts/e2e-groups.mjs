// Plans the emulator E2E jobs: `node scripts/e2e-groups.mjs [changed-files.txt]` picks the specs the listed files can affect (no list runs them all), splits them into balanced groups and writes the matrix to GITHUB_OUTPUT and the reason to GITHUB_STEP_SUMMARY when set
import fs from 'node:fs'

import { suiteSpecs } from '../.claude/skills/verify/spec-results.mjs'
import { affectedSpecs } from '../cypress/impact.js'

// Seconds per spec on the CI runner, Cypress start-up between specs included (run 43127128644, PR #704 (prune tests)); re-record when a spec grows or the slowest group drifts
export const SPEC_SECONDS = {
	'cypress/e2e/app/AppRoutes.cy.js': 9,
	'cypress/e2e/app/StalePersistedStore.cy.js': 4,
	'cypress/e2e/components/Navigation.cy.js': 11,
	'cypress/e2e/pages/Authentication.cy.js': 9,
	'cypress/e2e/pages/ContactTraveller.cy.js': 15,
	'cypress/e2e/pages/EditTrip.cy.js': 13,
	'cypress/e2e/pages/Messages.cy.js': 14,
	'cypress/e2e/pages/PageNotFound.cy.js': 4,
	'cypress/e2e/pages/Privacy.cy.js': 4,
	'cypress/e2e/pages/Register.cy.js': 16,
	'cypress/e2e/pages/TravellerDetail.cy.js': 8,
	'cypress/e2e/pages/Travellers.cy.js': 13,
}

// A spec with no recorded time still runs, weighted like an average one
export const UNKNOWN_SPEC_SECONDS = 10

// Each group starts its own emulators and build, so a short run is cheaper in one job
export const SECONDS_PER_GROUP = 40
export const MAX_GROUPS = 3

// Files outside src/ that the workflow runs on and that every spec goes through: the emulators, seed data, fixtures, the build and this planner
const FULL_RUN_FILES = [
	'cypress/',
	'cypress.config.js',
	'scripts/',
	'firebase/',
	'firebase.json',
	'.env.emulators',
	'index.html',
	'public/',
	'package.json',
	'package-lock.json',
	'vite.config.js',
	'.github/workflows/cypress-e2e.yml',
	'.github/actions/',
	'.claude/skills/verify/run-e2e.mjs',
	'.claude/skills/verify/spec-results.mjs',
]

// The specs themselves (cypress/impact.js runs a changed one), captures and Vitest tests change no E2E run
const NO_FULL_RUN = /^cypress\/(e2e|ui-check)\/|\/__tests__\//

const fullRunFile = (files) =>
	files.find(
		(file) =>
			!NO_FULL_RUN.test(file) &&
			FULL_RUN_FILES.some((prefix) => file.startsWith(prefix)),
	)

const weight = (spec) => SPEC_SECONDS[spec] ?? UNKNOWN_SPEC_SECONDS

// Longest first, each to the lightest group so far; sorting by name first keeps the split the same on every runner
export const splitSpecs = (specs, count) => {
	const groups = Array.from({ length: count }, () => ({
		specs: [],
		seconds: 0,
	}))
	const ordered = [...specs].sort().sort((a, b) => weight(b) - weight(a))
	for (const spec of ordered) {
		const lightest = groups.reduce((min, group) =>
			group.seconds < min.seconds ? group : min,
		)
		lightest.specs.push(spec)
		lightest.seconds += weight(spec)
	}
	return groups
}

const groupCount = (specs) => {
	const seconds = specs.reduce((sum, spec) => sum + weight(spec), 0)
	return Math.min(MAX_GROUPS, Math.ceil(seconds / SECONDS_PER_GROUP))
}

// null files (a push to main, a manual run) runs every spec
export const planSpecs = (files, suite) => {
	if (!files) return { specs: suite, reason: 'every spec (full run)' }
	const shared = fullRunFile(files)
	if (shared) {
		return {
			specs: suite,
			reason: `every spec: ${shared} affects them all`,
		}
	}
	const specs = affectedSpecs(files).filter((spec) => suite.includes(spec))
	// A new spec impact.js does not name yet still runs when it changes
	const added = files.filter(
		(file) => suite.includes(file) && !specs.includes(file),
	)
	const scoped = [...specs, ...added]
	if (scoped.length === suite.length) {
		return { specs: suite, reason: 'every spec: a shared app file changed' }
	}
	return {
		specs: scoped,
		reason: scoped.length
			? `${scoped.length} of ${suite.length} specs, for the changed files`
			: 'no spec: the change affects no E2E spec',
	}
}

export const planMatrix = (specs) => {
	const count = groupCount(specs)
	return splitSpecs(specs, count).map((group, index) => ({
		group: index + 1,
		count,
		specs: group.specs.join(','),
	}))
}

const readFiles = (listPath) =>
	listPath
		? fs
				.readFileSync(listPath, 'utf8')
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean)
		: null

const main = () => {
	const suite = suiteSpecs('e2e', process.cwd())
	const { specs, reason } = planSpecs(readFiles(process.argv[2]), suite)
	const include = planMatrix(specs)
	const lines = [
		`E2E: ${reason}`,
		...include.map(
			({ group, count, specs: list }) =>
				`- Group ${group} of ${count}: ${list.split(',').join(', ')}`,
		),
	].join('\n')
	console.log(lines)
	if (process.env.GITHUB_STEP_SUMMARY) {
		fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines}\n`)
	}
	if (process.env.GITHUB_OUTPUT) {
		fs.appendFileSync(
			process.env.GITHUB_OUTPUT,
			`matrix=${JSON.stringify({ include })}\ngroups=${include.length}\n`,
		)
	}
}

if (import.meta.url === `file://${process.argv[1]}`) main()
