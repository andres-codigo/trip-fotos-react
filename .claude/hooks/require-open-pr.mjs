import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { writesInRepo } from './bash-writes.mjs'

const BRANCH_PREFIXES = [
	'feature',
	'fix',
	'docs',
	'refactor',
	'enhancement',
	'chore',
	'test',
]

const input = JSON.parse(readFileSync(0, 'utf8'))
const command = input.tool_input?.command
const filePath = input.tool_input?.file_path

if (!filePath && command === undefined) process.exit(0)

const absolutePath = path.resolve(filePath ?? input.cwd ?? process.cwd())
let dir = filePath ? path.dirname(absolutePath) : absolutePath
while (!existsSync(dir) && dir !== path.dirname(dir)) dir = path.dirname(dir)

const git = (...args) =>
	spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' })

const toplevel = git('rev-parse', '--show-toplevel')

if (toplevel.status !== 0) process.exit(0)

// A Bash command is gated like Edit and Write only when it writes inside this repository
if (
	command !== undefined &&
	!writesInRepo(command, {
		cwd: absolutePath,
		repoRoot: toplevel.stdout.trim(),
	})
)
	process.exit(0)

if (git('check-ignore', '-q', absolutePath).status === 0) process.exit(0)

const branch = git('branch', '--show-current').stdout.trim()

const block = (reason) => {
	process.stderr.write(
		`${reason} Run /start-issue (create the issue if needed) before changing any file.\n`,
	)
	process.exit(2)
}

if (branch === 'main') block('Edits on main are blocked.')
if (!branch) process.exit(0)

// Bot branches are never edited here, but must not be locked out if they are
if (
	!BRANCH_PREFIXES.some((prefix) => branch.startsWith(`${prefix}/`)) &&
	!/^(dependabot\/|release-please--)/.test(branch)
)
	block(
		`Branch ${branch} has no type prefix (${BRANCH_PREFIXES.join(', ')}).`,
	)

const marker = path.join(
	os.tmpdir(),
	`open-pr-${branch.replace(/[^\w.-]/g, '_')}`,
)

if (existsSync(marker)) process.exit(0)

const prs = spawnSync(
	'gh',
	['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number'],
	{ cwd: dir, encoding: 'utf8' },
)

// Fail open: an offline or unauthenticated gh must not lock every edit
if (prs.status !== 0) process.exit(0)

if (JSON.parse(prs.stdout).length === 0)
	block(`Branch ${branch} has no open pull request, so no issue was started.`)

writeFileSync(marker, '')
