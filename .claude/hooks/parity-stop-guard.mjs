import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const MAX_BLOCKS_WITHOUT_PROGRESS = 3

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const statePath = path.join(projectDir, '.claude', 'parity', 'state.json')

// Only active while /parity-run owns the session; every other session stops normally
if (!existsSync(statePath)) process.exit(0)

let state
try {
	state = JSON.parse(readFileSync(statePath, 'utf8'))
} catch {
	process.exit(0)
}

if (state.status !== 'running') process.exit(0)

const queue = state.queue ?? []
const pending = queue.filter((item) => item.state === 'pending')
const doneCount = queue.filter((item) => item.state !== 'pending').length

if (pending.length === 0) process.exit(0)

const madeProgress = doneCount > (state.lastDoneCount ?? 0)
const blocks = madeProgress ? 0 : (state.stopBlocksWithoutProgress ?? 0) + 1

// Stop blocking once Claude is clearly stuck, so a broken item cannot loop forever
if (blocks > MAX_BLOCKS_WITHOUT_PROGRESS) {
	writeFileSync(
		statePath,
		JSON.stringify({ ...state, status: 'stalled' }, null, '\t') + '\n',
	)
	process.exit(0)
}

writeFileSync(
	statePath,
	JSON.stringify(
		{
			...state,
			lastDoneCount: doneCount,
			stopBlocksWithoutProgress: blocks,
		},
		null,
		'\t',
	) + '\n',
)

const next = pending[0]

process.stdout.write(
	JSON.stringify({
		decision: 'block',
		reason: `Parity run still has ${pending.length} pending item(s). Continue /parity-run with /implement-item ${next.issue} (${next.title}). If it cannot be completed, mark it needs-human in .claude/parity/state.json as /implement-item describes.`,
	}),
)
