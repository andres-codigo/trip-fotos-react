// Matches `git commit` as its own command, not text inside a quoted message or another git subcommand
export const isCommit = (command) =>
	/(^|[;&|(]\s*|&&\s*)git\s+((-[Cc]\s+\S+|-\S+)\s+)*commit(\s|$)/m.test(
		command.replace(/(["'])(?:\\.|(?!\1).)*\1/gs, '""'),
	)

// Docs-only changes skip /verify (CLAUDE.md); anything else needs a pass recorded for this exact tree
export const needsVerify = ({ files, tree, cache }) => {
	if (files.every((file) => /\.md$|^docs\//.test(file))) return false
	return !(cache?.tree === tree && cache.passed?.length > 0)
}
