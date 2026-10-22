import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const loadLabelConfig = (root = process.cwd()) =>
	JSON.parse(readFileSync(join(root, '.github/labels.json'), 'utf8'))

export const allLabels = (config) => [
	...config.type,
	...config.area,
	...config.status,
	...config.other,
]

export const statusLabel = (config, role) =>
	config.status.find((label) => label.role === role)?.name

// Type and area labels are owned by the workflows; status and other labels are set by people or Dependabot
export const managedLabelNames = (config) =>
	new Set([...config.type, ...config.area].map((label) => label.name))

// Root-anchored globs like actions/labeler: `*` stays within a segment, `**` spans segments
export const globToRegExp = (glob) => {
	let source = ''
	for (let i = 0; i < glob.length; i++) {
		const char = glob[i]
		if (char === '*' && glob[i + 1] === '*') {
			const slashFollows = glob[i + 2] === '/'
			source += slashFollows ? '(?:.*/)?' : '.*'
			i += slashFollows ? 2 : 1
		} else if (char === '*') source += '[^/]*'
		else if (char === '?') source += '[^/]'
		else if (char === '{') source += '(?:'
		else if (char === '}') source += ')'
		else if (char === ',') source += '|'
		else source += char.replace(/[.+^$()|[\]\\]/g, '\\$&')
	}
	return new RegExp(`^${source}$`)
}

const matchesAny = (globs = [], file) =>
	globs.some((glob) => globToRegExp(glob).test(file))

export const areasForFiles = (config, files) =>
	config.area
		.filter((area) =>
			files.some(
				(file) =>
					matchesAny(area.paths, file) &&
					!matchesAny(area.exclude, file),
			),
		)
		.map((area) => area.name)

const PREFIX = /^(?:tracking:\s*)?([a-z]+)(?:\([^)]*\))?!?:/i

const typeForPrefix = (config, prefix) =>
	config.type.find((type) => type.prefixes.includes(prefix.toLowerCase()))
		?.name || null

export const typeFor = (config, { title = '', branch = '' }) => {
	const fromTitle = title.trim().match(PREFIX)?.[1]
	const fromBranch = branch.split('/')[0]
	return (
		(fromTitle && typeForPrefix(config, fromTitle)) ||
		(branch.includes('/') && typeForPrefix(config, fromBranch)) ||
		null
	)
}

// Labels to add and remove so an item's managed labels equal `wanted`, leaving unmanaged labels alone
export const diffManagedLabels = (config, current, wanted) => {
	const managed = managedLabelNames(config)
	return {
		add: wanted.filter((name) => !current.includes(name)),
		remove: current.filter(
			(name) => managed.has(name) && !wanted.includes(name),
		),
	}
}

export const planLabelSync = (config, repoLabels) => {
	const defined = allLabels(config)
	const definedNames = new Set(defined.map((label) => label.name))
	const existing = new Map(repoLabels.map((label) => [label.name, label]))
	const steps = []

	for (const [from, to] of Object.entries(config.replaced)) {
		if (!existing.has(from)) continue
		if (to && !existing.has(to)) {
			// A rename keeps the label on every issue and PR that has it
			steps.push({ action: 'rename', from, to })
			existing.set(to, { ...existing.get(from), name: to })
			existing.delete(from)
		} else if (!definedNames.has(from)) {
			steps.push(
				to
					? { action: 'merge', from, to }
					: { action: 'delete', name: from },
			)
			existing.delete(from)
		}
	}

	for (const label of defined) {
		const current = existing.get(label.name)
		if (!current) steps.push({ action: 'create', ...pick(label) })
		else if (
			current.color?.toLowerCase() !== label.color.toLowerCase() ||
			(current.description || '') !== label.description
		)
			steps.push({ action: 'update', ...pick(label) })
	}

	for (const name of existing.keys()) {
		if (!definedNames.has(name)) steps.push({ action: 'delete', name })
	}

	return steps
}

const pick = ({ name, color, description }) => ({ name, color, description })
