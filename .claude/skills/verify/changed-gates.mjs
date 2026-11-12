const ALL = ['lint', 'vitest', 'ct', 'build']
// Selected only by the rules below: `all` stays the four full gates
const GATE_ORDER = [...ALL, 'yaml']

// First match wins, so narrower patterns sit above broader ones
const RULES = [
	// Tests ship nothing, so neither the build nor E2E follows them
	[/^src\/.*\.cy\.jsx?$/, ['lint', 'ct']],
	[/^src\/(.*\/__tests__\/|.*\.test\.)/, ['lint', 'vitest']],
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
	// The /ui-check capture spec is selected only by UI_CHECK=true, so no gate runs it; its helpers have Vitest tests
	[/^cypress\/ui-check\/(?!capture\.cy\.js$)/, ['lint', 'vitest']],
	[/^cypress\/ui-check\//, ['lint']],
	// The impact manifest has Vitest tests and no UI
	[/^cypress\/(impact\.js$|__tests__\/)/, ['lint', 'vitest']],
	// The support helpers have Vitest tests alongside them
	[/^cypress\/support\/utils\//, ['lint', 'vitest', 'ct']],
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

const isSrcTest = (file) =>
	/^src\/(.*\/__tests__\/|.*\.(test|cy)\.jsx?$)/.test(file)

const e2eReasons = (file) =>
	isSrcTest(file) ? [] : E2E_ADVISED.filter(([pattern]) => pattern.test(file))

// Files that can change how a page looks, so /ui-check comes before /verify; tests cannot
const isUiFile = (file) => /^src\/.*\.(jsx|css)$/.test(file) && !isSrcTest(file)

// Why /verify must wait for /ui-check, or null. A pass still holds after edits that touch no UI file (such as the tests for its fixes)
export const uiCheckGap = (files, { tree, uiStatus = {}, changedSince }) => {
	const ui = files.filter(isUiFile)
	if (!ui.length) return null
	if (uiStatus.state === 'pass' && uiStatus.tree) {
		if (uiStatus.tree === tree) return null
		const since = changedSince(uiStatus.tree)
		if (since && !since.some(isUiFile)) return null
	}
	const why =
		uiStatus.state === 'pass'
			? 'a UI file changed since /ui-check passed'
			: uiStatus.state
				? `/ui-check is at "${uiStatus.state}", not "pass"`
				: '/ui-check has not passed on this change'
	return `the change touches UI files (${ui.slice(0, 3).join(', ')}${ui.length > 3 ? ', …' : ''}) and ${why}: run /ui-check first, then /verify`
}

// The gates a file can affect, for deciding whether an earlier pass still holds; E2E also follows anything the build ships
export const gatesForFile = (file) => {
	const gates = new Set(RULES.find(([pattern]) => pattern.test(file))?.[1])
	if (gates.has('build') || e2eReasons(file).length) gates.add('e2e')
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
				e2eReasons(file).map(([, reason]) => reason),
			),
		),
	]

	const runArgs = GATE_ORDER.filter((gate) => gates.has(gate))
	if (e2e || reasons.length) runArgs.push('e2e')

	return { runArgs, reasons: e2e ? [] : reasons }
}
