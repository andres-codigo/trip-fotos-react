import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const input = JSON.parse(readFileSync(0, 'utf8'))

// Already blocked once this turn: do not loop
if (input.stop_hook_active) process.exit(0)

const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' })

const branch = run('git', ['branch', '--show-current']).stdout.trim()
if (!branch || branch === 'main') process.exit(0)
if (/^(dependabot\/|release-please--)/.test(branch)) process.exit(0)

const pr = run('gh', ['pr', 'view', branch, '--json', 'isDraft,state,files'])

// Fail open: an offline or unauthenticated gh must not trap the session
if (pr.status !== 0) process.exit(0)

const { isDraft, state, files } = JSON.parse(pr.stdout)

// A draft is work in progress; the Status is refreshed when the PR is made ready
if (state !== 'OPEN' || isDraft) process.exit(0)

const touched =
	files.some((file) => file.path === 'README.md') ||
	run('git', ['status', '--porcelain', '--', 'README.md']).stdout.trim()

if (touched) process.exit(0)

process.stderr.write(
	'This PR is ready for review but README.md is untouched, so the Status section was not refreshed. Run /finish-pr (move what shipped into Recently shipped, update Next up and the Project README), or say why no refresh is needed.\n',
)
process.exit(2)
