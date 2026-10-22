import { execSync } from 'node:child_process'

const ALL = ['lint', 'vitest', 'ct', 'build']

// First match wins, so narrower patterns sit above broader ones
const RULES = [
	[/^src\//, ALL],
	[/^package(-lock)?\.json$/, ALL],
	[/^jsconfig\.json$/, ALL],
	// Vitest and Cypress component tests both run through the Vite config
	[/^vite\.config\./, ['vitest', 'ct', 'build']],
	[/^cypress\/e2e\//, ['lint']],
	[/^cypress\//, ['lint', 'ct']],
	[/^cypress\.config\./, ['ct']],
	[/^((eslint|stylelint)\.config\.mjs|rules\/|declarations\/|.*\.d\.ts$)/, ['lint']],
	[/^(index\.html|public\/)/, ['build']],
]

// E2E stays opt-in (live Firebase, and CI runs it on every PR), so these only earn an advisory
const E2E_ADVISED = [
	[/^cypress\/(e2e|support)\//, 'E2E specs or support changed'],
	[/^cypress\.config\./, 'Cypress config changed'],
	[/^src\/(app|pages)\//, 'routing or pages changed'],
	[/^src\/store\//, 'store or persisted state changed'],
	[/^src\/services\//, 'Firebase services changed'],
	[/^src\/constants\/(api|ui\/paths)/, 'API or route constants changed'],
]

const git = (args) =>
	execSync(`git ${args}`, { encoding: 'utf8' }).split('\n').filter(Boolean)

const forceAll = process.argv.includes('all')
const base = git('merge-base origin/main HEAD')[0]
const files = [
	...new Set([
		...git(`diff --name-only ${base}`),
		...git('ls-files --others --exclude-standard'),
	]),
]

const gates = new Set(forceAll ? ALL : [])
for (const file of files) {
	const rule = RULES.find(([pattern]) => pattern.test(file))
	rule?.[1].forEach((gate) => gates.add(gate))
}

const reasons = new Set(
	files.flatMap((file) =>
		E2E_ADVISED.filter(([pattern]) => pattern.test(file)).map(
			([, reason]) => reason,
		),
	),
)

// The agent passes this line straight to run-gates.mjs, so opt-ins are decided here rather than by the agent
const runArgs = ALL.filter((gate) => gates.has(gate))
if (process.argv.includes('e2e')) runArgs.push('e2e')
if (runArgs.length && forceAll) runArgs.push('fresh')

console.log(runArgs.join(' ') || 'none')
if (reasons.size && !process.argv.includes('e2e'))
	console.log(`e2e advised: ${[...reasons].join('; ')}`)
