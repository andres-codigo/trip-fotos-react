import { gateHolds, planGates } from '../skills/verify/changed-gates.mjs'

// Matches `git commit` as its own command, not text inside a quoted message or another git subcommand
export const isCommit = (command) =>
	/(^|[;&|(]\s*|&&\s*)git\s+((-[Cc]\s+\S+|-\S+)\s+)*commit(\s|$)/m.test(
		command.replace(/(["'])(?:\\.|(?!\1).)*\1/gs, '""'),
	)

// Docs-only changes skip /verify (CLAUDE.md). Otherwise every gate the branch needs must hold for this tree: passed on it, or on an earlier tree with no change since that the gate depends on. E2E is left to CI, as before
export const needsVerify = ({ files, branch, tree, cache, changedSince }) => {
	if (files.every((file) => /\.md$|^docs\//.test(file))) return false
	return planGates(branch)
		.runArgs.filter((gate) => gate !== 'e2e')
		.some((gate) => !gateHolds(gate, { tree, cache, changedSince }))
}
