import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { isCommit, needsVerify } from './commit-gate.mjs'

const input = JSON.parse(fs.readFileSync(0, 'utf8'))
const command = input.tool_input?.command

if (!command || !isCommit(command)) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const run = (cmd, env) =>
	execSync(cmd, { cwd: projectDir, env, encoding: 'utf8' }).trim()

try {
	// Same throwaway-index hash as run-gates.mjs, so the result is for this exact tree
	const index = path.join(os.tmpdir(), `commit-gate-index-${process.pid}`)
	const env = { ...process.env, GIT_INDEX_FILE: index }
	let tree
	let files
	try {
		run('git add -A', env)
		tree = run('git write-tree', env)
		files = run('git diff --cached --name-only HEAD', env)
			.split('\n')
			.filter(Boolean)
	} finally {
		fs.rmSync(index, { force: true })
	}

	let cache = {}
	try {
		cache = JSON.parse(
			fs.readFileSync(
				path.join(projectDir, 'node_modules/.cache/verify/passed.json'),
				'utf8',
			),
		)
	} catch {
		// No recorded run
	}

	if (files.length && needsVerify({ files, tree, cache })) {
		process.stderr.write(
			'No /verify pass is recorded for this exact code. Run /verify (not the gates by hand) and commit once it passes; docs-only changes are exempt.\n',
		)
		process.exit(2)
	}
} catch {
	// Fail open: a git error must not lock every commit
}
