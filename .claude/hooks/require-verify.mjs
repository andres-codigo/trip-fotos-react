import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {
	branchFiles,
	changedSince,
	treeHash,
} from '../skills/verify/git-tree.mjs'

import { isCommit, needsVerify } from './commit-gate.mjs'

const input = JSON.parse(fs.readFileSync(0, 'utf8'))
const command = input.tool_input?.command

if (!command || !isCommit(command)) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()

try {
	const tree = treeHash(projectDir)
	// Uncommitted changes only, for the docs-only exemption
	const files = execSync('git status --porcelain --untracked-files=all', {
		cwd: projectDir,
		encoding: 'utf8',
	})
		.split('\n')
		.filter(Boolean)
		.map((line) => line.slice(3).split(' -> ').pop())

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

	if (
		files.length &&
		needsVerify({
			files,
			branch: branchFiles(projectDir),
			tree,
			cache,
			changedSince: changedSince(projectDir, tree),
		})
	) {
		process.stderr.write(
			'No /verify pass holds for this code. Run /verify (not the gates by hand) and commit once it passes; docs-only changes are exempt.\n',
		)
		process.exit(2)
	}
} catch {
	// Fail open: a git error must not lock every commit
}
