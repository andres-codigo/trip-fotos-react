// Records where a /ui-check run is, for the status line: node status.mjs <capturing|reviewing|pass|hold>
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'

const STATES = ['capturing', 'reviewing', 'pass', 'hold']
const state = process.argv[2]

if (!STATES.includes(state)) {
	console.error(`Usage: status.mjs <${STATES.join('|')}>`)
	process.exit(1)
}

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const cacheDir = path.join(projectDir, 'node_modules', '.cache', 'ui-check')

// Same working-tree hash as /verify, so the status line can tell a result from an older tree
const treeHash = () => {
	const index = path.join(os.tmpdir(), `ui-check-index-${process.pid}`)
	const env = { ...process.env, GIT_INDEX_FILE: index }
	try {
		execSync('git add -A', { cwd: projectDir, env })
		return execSync('git write-tree', {
			cwd: projectDir,
			env,
			encoding: 'utf8',
		}).trim()
	} finally {
		fs.rmSync(index, { force: true })
	}
}

fs.mkdirSync(cacheDir, { recursive: true })
fs.writeFileSync(
	path.join(cacheDir, 'status.json'),
	JSON.stringify({ state, tree: treeHash(), updated: Date.now() }),
)
