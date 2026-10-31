import fs from 'node:fs'
import path from 'node:path'

// Clears the status-line results so a tick is only ever earned by the run in hand; `cache` also forgets which gates passed
export const resetChecks = (projectDir, { cache = false } = {}) => {
	const root = path.join(projectDir, 'node_modules', '.cache')
	const files = [
		path.join(root, 'verify', 'status.json'),
		path.join(root, 'ui-check', 'status.json'),
		...(cache ? [path.join(root, 'verify', 'passed.json')] : []),
	]
	for (const file of files) fs.rmSync(file, { force: true })
	return files
}

if (import.meta.url === `file://${process.argv[1]}`) {
	resetChecks(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), {
		cache: process.argv.includes('cache'),
	})
}
