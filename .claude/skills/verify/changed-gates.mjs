import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const ALL = ['lint', 'vitest', 'ct', 'build']

// First match wins, so narrower patterns sit above broader ones
const RULES = [
	[/^src\//, ALL],
	[/^package(-lock)?\.json$/, ALL],
	[/^jsconfig\.json$/, ALL],
	// Repo tooling has Vitest tests but no UI, so no component tests or build
	[/^(\.claude|scripts)\/.*\.m?js$/, ['lint', 'vitest']],
	// Vitest and Cypress component tests both run through the Vite config
	[/^vite\.config\./, ['vitest', 'ct', 'build']],
	[/^cypress\/e2e\//, ['lint']],
	[/^cypress\//, ['lint', 'ct']],
	[/^cypress\.config\./, ['ct']],
	[/^(config\/|.*\.d\.ts$)/, ['lint']],
	[/^(index\.html|public\/)/, ['build']],
]

// Changes that can break routing, auth, the store or forms: E2E runs for these without being asked (CI is the backstop for everything else)
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

// The agent passes `runArgs` straight to run-gates.mjs, so opt-ins are decided here rather than by the agent
export const planGates = (files, { e2e = false, all = false } = {}) => {
	const gates = new Set(all ? ALL : [])
	for (const file of files) {
		const rule = RULES.find(([pattern]) => pattern.test(file))
		rule?.[1].forEach((gate) => gates.add(gate))
	}

	const reasons = [
		...new Set(
			files.flatMap((file) =>
				E2E_ADVISED.filter(([pattern]) => pattern.test(file)).map(
					([, reason]) => reason,
				),
			),
		),
	]

	const runArgs = ALL.filter((gate) => gates.has(gate))
	if (e2e || reasons.length) runArgs.push('e2e')
	if (runArgs.length && all) runArgs.push('fresh')

	return { runArgs, reasons: e2e ? [] : reasons }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const base = git('merge-base origin/main HEAD')[0]
	const files = [
		...new Set([
			...git(`diff --name-only ${base}`),
			...git('ls-files --others --exclude-standard'),
		]),
	]
	const { runArgs, reasons } = planGates(files, {
		e2e: process.argv.includes('e2e'),
		all: process.argv.includes('all'),
	})

	console.log(runArgs.join(' ') || 'none')
	if (reasons.length) console.log(`e2e advised: ${reasons.join('; ')}`)
}
