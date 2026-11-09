import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const git = (args, { cwd, env } = {}) =>
	execSync(`git ${args}`, { cwd, env, encoding: 'utf8' }).trim()

const lines = (text) => text.split('\n').filter(Boolean)

// Hashing the working tree through a throwaway index covers uncommitted and untracked files, so any edit gives a new hash
export const treeHash = (cwd) => {
	const index = path.join(
		os.tmpdir(),
		`verify-index-${process.pid}-${Date.now()}`,
	)
	const env = { ...process.env, GIT_INDEX_FILE: index }
	try {
		git('add -A', { cwd, env })
		return git('write-tree', { cwd, env })
	} finally {
		fs.rmSync(index, { force: true })
	}
}

// Both sides of a rename count as changed; null when git cannot read the old tree
export const changedSince = (cwd, tree) => (from) => {
	try {
		return lines(
			git(`diff --no-renames --name-only ${from} ${tree}`, { cwd }),
		)
	} catch {
		return null
	}
}

// Everything the branch changes against main, committed or not
export const branchFiles = (cwd) => {
	const base = git('merge-base origin/main HEAD', { cwd })
	return [
		...new Set([
			...lines(git(`diff --name-only ${base}`, { cwd })),
			...lines(git('ls-files --others --exclude-standard', { cwd })),
		]),
	]
}
