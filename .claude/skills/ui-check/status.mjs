// Records where a /ui-check run is, for the status line: node status.mjs <capturing|reviewing|pass|hold>
import fs from 'node:fs'
import path from 'node:path'

import { treeHash } from '../verify/git-tree.mjs'

const STATES = ['capturing', 'reviewing', 'pass', 'hold']
const state = process.argv[2]

if (!STATES.includes(state)) {
	console.error(`Usage: status.mjs <${STATES.join('|')}>`)
	process.exit(1)
}

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const cacheDir = path.join(projectDir, 'node_modules', '.cache', 'ui-check')

fs.mkdirSync(cacheDir, { recursive: true })
fs.writeFileSync(
	path.join(cacheDir, 'status.json'),
	JSON.stringify({ state, tree: treeHash(projectDir), updated: Date.now() }),
)
