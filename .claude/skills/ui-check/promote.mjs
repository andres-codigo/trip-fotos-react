// After a merge, moves each branch capture into `main` when nothing it depends on changed since: node promote.mjs
// A squash merge gives main the tree the branch was captured on, so those shots are main's. The rest are deleted, and the next check retakes them
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {
	BRANCH_LABEL,
	MAIN_LABEL,
	capturesDir,
	followMain,
	readStamp,
	scriptHashAt,
	staleBetween,
	stampPath,
} from './main-captures.mjs'

// `staleFor(tree)` is what staleBetween gives from that tree to the merge: undefined (unreadable) or null (all) promotes nothing from it
export const promoteRecord = (stamp, record, staleFor) => {
	const promoted = []
	const skipped = []
	const captures = { ...stamp.captures }
	for (const [id, { tree, widths }] of Object.entries(
		record?.captures ?? {},
	)) {
		const stale = staleFor(tree)
		if (Array.isArray(stale) && !stale.includes(id)) {
			captures[id] = widths
			promoted.push(id)
		} else skipped.push(id)
	}
	return { stamp: { ...stamp, captures }, promoted, skipped }
}

// The main record on `commit`, moved there first when it was taken on an older one
const mainStampAt = (projectDir, file, commit) => {
	const stamp = readStamp(file)
	const moved =
		stamp?.captures && stamp.commit !== commit
			? followMain(projectDir, file, stamp, commit)
			: stamp
	return moved?.captures && moved.commit === commit
		? moved
		: { commit, script: scriptHashAt(projectDir, commit), captures: {} }
}

export const promote = (projectDir) => {
	const dir = capturesDir(projectDir)
	const recordFile = stampPath(dir, BRANCH_LABEL)
	const branchDir = path.join(dir, BRANCH_LABEL)
	const record = readStamp(recordFile)
	if (!record?.captures) return null
	const commit = execSync('git rev-parse main', {
		cwd: projectDir,
		encoding: 'utf8',
	}).trim()
	const file = stampPath(dir)
	const stamp = mainStampAt(projectDir, file, commit)
	// A branch run left without its folder has nothing to move
	const present = Object.fromEntries(
		Object.entries(record.captures).filter(([id]) =>
			fs.existsSync(path.join(branchDir, id)),
		),
	)
	const stale = new Map()
	const result = promoteRecord(stamp, { captures: present }, (tree) => {
		if (!stale.has(tree)) {
			stale.set(tree, staleBetween(projectDir, tree, commit))
		}
		return stale.get(tree)
	})
	for (const id of result.promoted) {
		const target = path.join(dir, MAIN_LABEL, id)
		fs.rmSync(target, { recursive: true, force: true })
		fs.mkdirSync(path.dirname(target), { recursive: true })
		fs.renameSync(path.join(branchDir, id), target)
	}
	fs.writeFileSync(file, JSON.stringify(result.stamp))
	fs.rmSync(branchDir, { recursive: true, force: true })
	fs.rmSync(recordFile, { force: true })
	const deleted = Object.keys(record.captures).filter(
		(id) => !result.promoted.includes(id),
	)
	return { commit, promoted: result.promoted, deleted }
}

const main = () => {
	const result = promote(process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
	if (!result) {
		console.log('no branch captures recorded')
		return
	}
	const { commit, promoted, deleted } = result
	console.log(
		`promoted to main at ${commit.slice(0, 7)}: ${promoted.join(', ') || 'none'}` +
			(deleted.length ? `; deleted: ${deleted.join(', ')}` : ''),
	)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
