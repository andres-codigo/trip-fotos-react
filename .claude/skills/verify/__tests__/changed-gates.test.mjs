import { gateHolds, gatesForFile, planGates } from '../changed-gates.mjs'

describe('planGates', () => {
	it('adds e2e and names the reason when the change touches routing', () => {
		const { runArgs, reasons } = planGates([
			'src/pages/travellers/Travellers.jsx',
		])

		expect(runArgs).toEqual(['lint', 'vitest', 'ct', 'build', 'e2e'])
		expect(reasons).toEqual(['routing or pages changed'])
	})

	it('runs e2e for an E2E-only change, alongside lint', () => {
		const { runArgs } = planGates(['cypress/e2e/pages/Register.cy.js'])

		expect(runArgs).toEqual(['lint', 'e2e'])
	})

	it('leaves e2e out of a change that cannot break it', () => {
		const { runArgs, reasons } = planGates(['src/components/ui/Badge.jsx'])

		expect(runArgs).toEqual(['lint', 'vitest', 'ct', 'build'])
		expect(reasons).toEqual([])
	})

	it('reports none for docs-only changes', () => {
		expect(planGates(['docs/ai-assistance.md']).runArgs).toEqual([])
		expect(planGates(['.claude/skills/verify/SKILL.md']).runArgs).toEqual(
			[],
		)
		expect(planGates(['.github/labels.json']).runArgs).toEqual([])
	})

	it('runs lint and Vitest for tooling scripts, without e2e', () => {
		for (const file of [
			'.claude/skills/verify/changed-gates.mjs',
			'.claude/hooks/require-open-pr.mjs',
			'scripts/start-issue.mjs',
			'.github/scripts/labels.mjs',
		]) {
			expect(planGates([file])).toEqual({
				runArgs: ['lint', 'vitest'],
				reasons: [],
			})
		}
	})

	it('adds e2e once, with no advisory, when it is forced', () => {
		const { runArgs, reasons } = planGates(['src/store/index.js'], {
			e2e: true,
		})

		expect(runArgs.filter((arg) => arg === 'e2e')).toHaveLength(1)
		expect(reasons).toEqual([])
	})

	it('forces every gate with all, without e2e', () => {
		expect(planGates([], { all: true }).runArgs).toEqual([
			'lint',
			'vitest',
			'ct',
			'build',
		])
	})

	it('selects only the YAML gate for workflow and action YAML', () => {
		for (const file of [
			'.github/workflows/cypress-e2e.yml',
			'.github/actions/setup/action.yml',
		]) {
			expect(planGates([file]).runArgs).toEqual(['yaml'])
		}
	})

	it('selects Vitest for the inputs the drift test reads', () => {
		for (const file of [
			'vercel.json',
			'firebase/database.rules.json',
			'.env.example',
		]) {
			expect(planGates([file]).runArgs).toEqual(['vitest'])
		}
	})

	it('keeps the existing gates when YAML changes alongside code', () => {
		expect(
			planGates([
				'.github/workflows/a.yml',
				'src/components/ui/Badge.jsx',
			]).runArgs,
		).toEqual(['lint', 'vitest', 'ct', 'build', 'yaml'])
		expect(
			planGates(['.github/workflows/a.yml', '.github/scripts/labels.mjs'])
				.runArgs,
		).toEqual(['lint', 'vitest', 'yaml'])
	})

	it('keeps Markdown, labels and other config exempt', () => {
		for (const file of [
			'README.md',
			'.github/labels.json',
			'firebase.json',
		]) {
			expect(planGates([file]).runArgs).toEqual([])
		}
	})
})

describe('gatesForFile', () => {
	it('adds e2e for anything the build ships', () =>
		expect([...gatesForFile('src/components/ui/Badge.jsx')]).toEqual([
			'lint',
			'vitest',
			'ct',
			'build',
			'e2e',
		]))

	it('keeps the /ui-check capture spec to lint', () =>
		expect([...gatesForFile('cypress/ui-check/capture.cy.js')]).toEqual([
			'lint',
		]))

	it('maps tooling scripts to lint and Vitest only', () =>
		expect([...gatesForFile('.claude/skills/ui-check/status.mjs')]).toEqual(
			['lint', 'vitest'],
		))
})

describe('gateHolds', () => {
	const cache = { gates: { lint: 't1', build: 't1' } }
	const changedSince = (files) => () => files

	it('holds on the tree it passed on', () =>
		expect(
			gateHolds('lint', {
				tree: 't1',
				cache,
				changedSince: changedSince([]),
			}),
		).toBe(true))

	it('holds when nothing it depends on changed since', () =>
		expect(
			gateHolds('build', {
				tree: 't2',
				cache,
				changedSince: changedSince([
					'.claude/skills/ui-check/status.mjs',
				]),
			}),
		).toBe(true))

	it('lapses when a file it depends on changed since', () =>
		expect(
			gateHolds('lint', {
				tree: 't2',
				cache,
				changedSince: changedSince([
					'.claude/skills/ui-check/status.mjs',
				]),
			}),
		).toBe(false))

	it('lapses when git cannot read the earlier tree', () =>
		expect(
			gateHolds('build', { tree: 't2', cache, changedSince: () => null }),
		).toBe(false))

	it('lapses when the gate never passed', () =>
		expect(
			gateHolds('vitest', {
				tree: 't1',
				cache,
				changedSince: changedSince([]),
			}),
		).toBe(false))
})
