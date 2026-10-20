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
	[/^(eslint\.config\.mjs|rules\/|declarations\/|.*\.d\.ts$)/, ['lint']],
	[/^(index\.html|public\/)/, ['build']],
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

console.log(ALL.filter((gate) => gates.has(gate)).join(' ') || 'none')
