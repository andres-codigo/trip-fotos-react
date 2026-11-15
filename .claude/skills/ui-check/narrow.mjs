// Drops the branch files that cannot change an existing capture, so cypress/impact.js does not read them as shared or capture tooling.
// Reads the Prettier layout (tabs, closing brackets on their own line), never a parser: the capture script and config are formatted on commit
export const CAPTURE_SCRIPT = 'cypress/ui-check/capture.cy.js'
export const CYPRESS_CONFIG = 'cypress.config.js'

const indentOf = (line) => line.match(/^\t*/)[0].length
const CLOSING = /^\s*[}\])]/
const COMMENT = /^\s*(\/\/|\/\*|\*)/
const CONTAINER = /^\t*(describe|context)\(/
const CAPTURE = /^\t*capture\(\s*'([\w-]+)'/
const IMPORT = /^import\s+(.+?)\s+from\s+'([^']+)'/s
// What a new statement may be without reaching the captures already there
const DECLARATION = /^\t*(const|let|function|async function)\s/

// A unit starts at a line indented to its depth, and takes every deeper or closing line after it
const units = (lines, depth) => {
	const found = []
	for (const line of lines) {
		if (indentOf(line) === depth && !CLOSING.test(line)) found.push([line])
		else found.at(-1)?.push(line)
	}
	return found
}

// Imports split into one leaf per name, so adding a name leaves the rest untouched
const importLeaves = (text) => {
	const [, names, source] = text.match(IMPORT) ?? []
	if (!source) return [{ key: text, declaration: false }]
	return names
		.replace(/[{}]/g, ',')
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean)
		.map((name) => ({
			key: `import ${name} from ${source}`,
			declaration: true,
		}))
}

const collect = (lines, depth, path, out) => {
	for (const unit of units(lines, depth)) {
		const text = unit.join('\n')
		const capture = text.match(CAPTURE)
		if (capture) out.captures[capture[1]] = text
		else if (CONTAINER.test(unit[0])) {
			collect(unit.slice(1, -1), depth + 1, `${path}${unit[0]}\n`, out)
		} else if (depth === 0 && text.startsWith('import')) {
			out.leaves.push(...importLeaves(text))
		} else {
			out.leaves.push({
				key: path + text,
				declaration: DECLARATION.test(unit[0]),
			})
		}
	}
	return out
}

// Each capture's body, and every other statement as a leaf under its describe and context lines
export const captureScriptParts = (source) =>
	collect(
		source.split('\n').filter((line) => line.trim() && !COMMENT.test(line)),
		0,
		'',
		{ captures: {}, leaves: [] },
	)

// The captures a script change adds, or null when it changes an existing capture or anything they share
export const addedCaptures = (before, after) => {
	if (before == null || after == null) return null
	const old = captureScriptParts(before)
	const next = captureScriptParts(after)
	if (
		Object.entries(old.captures).some(
			([id, body]) => next.captures[id] !== body,
		)
	) {
		return null
	}
	const unmatched = [...next.leaves]
	for (const { key } of old.leaves) {
		const index = unmatched.findIndex((leaf) => leaf.key === key)
		if (index === -1) return null
		unmatched.splice(index, 1)
	}
	// A new hook or call runs for the captures beside it; a new helper runs only where a new capture calls it
	if (unmatched.some(({ declaration }) => !declaration)) return null
	return Object.keys(next.captures).filter((id) => !(id in old.captures))
}

// The line numbers inside each `expose: { ... }` block
const exposeLines = (source) => {
	const lines = source.split('\n')
	const inside = new Set()
	lines.forEach((line, index) => {
		if (!/^\t*expose: \{$/.test(line)) return
		const close = new RegExp(`^\\t{${indentOf(line)}}\\},?$`)
		for (
			let at = index + 1;
			at < lines.length && !close.test(lines[at]);
			at++
		) {
			inside.add(at + 1)
		}
	})
	return inside
}

// True when a `git diff -U0` of the config only adds lines inside an `expose` block, which a capture reads only by name
export const onlyAddsExposeKeys = (diff, after) => {
	if (!diff || after == null) return false
	const inside = exposeLines(after)
	const hunks = [
		...diff.matchAll(/^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm),
	]
	return (
		hunks.length > 0 &&
		hunks.every(([, removed = '1', start, added = '1']) => {
			if (Number(removed) !== 0) return false
			return Array.from(
				{ length: Number(added) },
				(_, offset) => Number(start) + offset,
			).every((line) => inside.has(line))
		})
	)
}

// The files impact.js should still read, and the captures a script change adds.
// `git` answers per file: isNew, before and after (text or null), diff (`git diff -U0` against the base)
export const narrowChange = (files, git) => {
	const kept = []
	const added = []
	for (const file of files) {
		if (file === CAPTURE_SCRIPT) {
			const ids = addedCaptures(git.before(file), git.after(file))
			if (ids) {
				added.push(...ids)
				continue
			}
		} else if (file === CYPRESS_CONFIG) {
			if (onlyAddsExposeKeys(git.diff(file), git.after(file))) continue
		} else if (file.startsWith('src/') && git.isNew(file)) {
			// A new file reaches a page only through an existing file that imports it, which the branch changes too
			continue
		} else if (file.startsWith('src/constants/')) {
			// A new constant changes nothing until a page uses it, and that page's change selects its captures
			if (!/^-(?!--)/m.test(git.diff(file) ?? '-')) continue
		}
		kept.push(file)
	}
	return { kept, added }
}
