import { planGates } from '../changed-gates.mjs'

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
	})

	it('runs lint and Vitest for tooling scripts, without e2e', () => {
		for (const file of [
			'.claude/skills/verify/changed-gates.mjs',
			'.claude/hooks/require-open-pr.mjs',
			'scripts/start-issue.mjs',
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

	it('forces every gate and a fresh run with all, without e2e', () => {
		expect(planGates([], { all: true }).runArgs).toEqual([
			'lint',
			'vitest',
			'ct',
			'build',
			'fresh',
		])
	})
})
