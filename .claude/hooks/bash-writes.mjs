import os from 'node:os'
import path from 'node:path'

// Writers whose targets cannot be read off the command line
const UNRESOLVABLE =
	/\bsed\s+-[a-zA-Z]*i|\bperl\s+-[a-zA-Z]*i|\bgit\s+(rm|mv|apply)\b|\bpython3?\s+(-\S+\s+)*-?\s*<<|\bnode\s+-e/

const REDIRECT = /(?<![\w>&-])\d?>>?\s*([^\s&|;)<>]+)/g
const TARGET_COMMANDS = new Set(['tee', 'cp', 'mv', 'rm', 'touch'])

// Drops heredoc bodies and quoted text, so words inside an issue or PR body never look like commands
const stripQuoted = (command) =>
	command
		.replace(
			/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\2(?=\n|$)/g,
			'<<$2$3',
		)
		.replace(/"(?:\\.|[^"\\])*"|'[^']*'/g, '""')

const targetsOf = (command) => {
	const targets = [...command.matchAll(REDIRECT)].map((match) => match[1])

	for (const segment of command.split(/[;&|\n]+/)) {
		const words = segment
			.trim()
			.split(/\s+/)
			.filter((word) => !/^\w+=/.test(word))
		const args = words.slice(1).filter((word) => !word.startsWith('-'))
		if (!TARGET_COMMANDS.has(words[0])) continue
		targets.push(...(words[0] === 'cp' ? args.slice(-1) : args))
	}

	return targets
}

const isInside = (parent, child) =>
	child === parent || child.startsWith(`${parent}${path.sep}`)

// A target that cannot be resolved (quoted or a variable) counts as inside the repository
export const writesInRepo = (command, { cwd, repoRoot }) => {
	const stripped = stripQuoted(command)

	if (UNRESOLVABLE.test(stripped)) return true

	return targetsOf(stripped).some((target) => {
		if (target === '""' || target.includes('$')) return true

		const absolute = path.resolve(
			cwd,
			target.replace(/^~(?=\/|$)/, os.homedir()),
		)

		return isInside(repoRoot, absolute)
	})
}
