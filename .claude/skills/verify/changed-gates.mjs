const ALL = ['lint', 'vitest', 'ct', 'build']
// Selected only by the rules below: `all` stays the four full gates
const GATE_ORDER = [...ALL, 'yaml']

// First match wins, so narrower patterns sit above broader ones
const RULES = [
	[/^src\//, ALL],
	[/^package(-lock)?\.json$/, ALL],
	[/^jsconfig\.json$/, ALL],
	// Repo tooling has Vitest tests but no UI, so no component tests or build
	[/^(\.claude|\.github|scripts)\/.*\.m?js$/, ['lint', 'vitest']],
	// Vitest and Cypress component tests both run through the Vite config
	// A syntax check is all workflow and action YAML has locally
	[/^\.github\/(workflows|actions)\/.*\.ya?ml$/, ['yaml']],
	// Read by .github/scripts/__tests__/drift.test.mjs (README.md is an accepted gap)
	[/^(vercel\.json|firebase\/|\.env\.example$)/, ['vitest']],
	[/^vite\.config\./, ['vitest', 'ct', 'build']],
	[/^cypress\/e2e\//, ['lint']],
	// The /ui-check capture spec is selected only by UI_CHECK=true, so no gate runs it
	[/^cypress\/ui-check\//, ['lint']],
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

// The gates a file can affect, for deciding whether an earlier pass still holds; E2E also follows anything the build ships
export const gatesForFile = (file) => {
	const gates = new Set(RULES.find(([pattern]) => pattern.test(file))?.[1])
	if (
		gates.has('build') ||
		E2E_ADVISED.some(([pattern]) => pattern.test(file))
	)
		gates.add('e2e')
	return gates
}

// A gate still holds when it passed on an earlier tree and nothing changed since that it depends on. `changedSince(tree)` lists the files that differ from the tree in hand, or null when git cannot tell (for example a pruned tree)
export const gateHolds = (gate, { tree, cache, changedSince }) => {
	const passedOn = cache?.gates?.[gate]
	if (!passedOn) return false
	if (passedOn === tree) return true
	const files = changedSince(passedOn)
	return files !== null && !files.some((file) => gatesForFile(file).has(gate))
}

// The planner passes `runArgs` straight to the gate runner, so opt-ins are decided here rather than by the caller
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

	const runArgs = GATE_ORDER.filter((gate) => gates.has(gate))
	if (e2e || reasons.length) runArgs.push('e2e')

	return { runArgs, reasons: e2e ? [] : reasons }
}
