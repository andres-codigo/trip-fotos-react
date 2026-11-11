// Per-spec results for the two Cypress gates, so /verify reruns only the specs that failed on the same tree
import fs from 'node:fs'
import path from 'node:path'

// Each gate's whole suite, as the paths Cypress reports in `spec.relative`
const SUITES = {
	e2e: { pattern: 'cypress/e2e/**/*.cy.js', exclude: [] },
	ct: {
		pattern: '**/*.cy.{js,jsx,ts,tsx}',
		// cypress.config.js `component.excludeSpecPattern`, plus dependencies
		exclude: [
			'node_modules',
			'cypress/e2e',
			'cypress/e2e-live',
			'cypress/ui-check',
		],
	},
}

export const isSpecGate = (gate) => gate in SUITES

// Files only: a failed spec leaves a screenshots folder named after it
export const suiteSpecs = (gate, cwd) => {
	const { pattern, exclude } = SUITES[gate]
	return fs
		.globSync(pattern, {
			cwd,
			withFileTypes: true,
			exclude: (entry) => {
				const file = path.relative(
					cwd,
					path.join(entry.parentPath, entry.name),
				)
				return exclude.some(
					(dir) => file === dir || file.startsWith(`${dir}/`),
				)
			},
		})
		.filter((entry) => entry.isFile())
		.map((entry) =>
			path.relative(cwd, path.join(entry.parentPath, entry.name)),
		)
		.sort()
}

// Cypress `after:spec` handler: appends one line per spec to VERIFY_SPEC_RESULTS, set only by /verify
export const recordSpec = (
	spec,
	results,
	file = process.env.VERIFY_SPEC_RESULTS,
) => {
	if (!file) return
	const passed =
		Boolean(results?.stats) &&
		!results.error &&
		results.stats.failures === 0
	fs.appendFileSync(
		file,
		`${JSON.stringify({ spec: spec.relative, passed })}\n`,
	)
}

export const readSpecResults = (file) => {
	try {
		return fs
			.readFileSync(file, 'utf8')
			.split('\n')
			.filter(Boolean)
			.map((line) => JSON.parse(line))
	} catch {
		return []
	}
}

// The specs still to pass on this tree, or null for the whole suite. Results recorded on any other tree are discarded
export const specsToRun = ({ suite, record, tree }) => {
	if (record?.tree !== tree || !record.passed?.length) return null
	const passed = new Set(record.passed)
	return suite.filter((spec) => !passed.has(spec))
}

// The specs that have passed on this tree so far, after a run that failed
export const passedSpecs = ({ record, tree, results }) => [
	...new Set([
		...(record?.tree === tree ? (record.passed ?? []) : []),
		...results.filter(({ passed }) => passed).map(({ spec }) => spec),
	]),
]
