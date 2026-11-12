// Splits the emulator E2E specs into balanced groups for the parallel CI jobs: `node scripts/e2e-groups.mjs <group> <count>` prints group <group> (1-based) as Cypress `--spec` input
import { suiteSpecs } from '../.claude/skills/verify/spec-results.mjs'

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

const main = () => {
	const [group, count] = process.argv.slice(2).map(Number)
	if (
		!Number.isInteger(count) ||
		count < 1 ||
		!(group >= 1 && group <= count)
	) {
		console.error('Usage: node scripts/e2e-groups.mjs <group> <count>')
		process.exit(1)
	}
	const { specs } = splitSpecs(suiteSpecs('e2e', process.cwd()), count)[
		group - 1
	]
	if (!specs.length) {
		console.error(`E2E group ${group} of ${count} has no specs`)
		process.exit(1)
	}
	console.log(specs.join(','))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
