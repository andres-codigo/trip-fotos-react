// The captures the branch can affect: node affected.mjs. Prints the UI_CHECK_ONLY for both refs, or nothing when every capture is affected
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { CAPTURES, affectedCaptures } from '../../../cypress/impact.js'
import { branchFiles } from '../verify/git-tree.mjs'
import { narrowChange } from './narrow.mjs'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const git = (...args) => {
	try {
		return execFileSync('git', args, { cwd: projectDir, encoding: 'utf8' })
	} catch {
		return null
	}
}
const base = git('merge-base', 'origin/main', 'HEAD').trim()

const { kept, added } = narrowChange(branchFiles(projectDir), {
	isNew: (file) => git('cat-file', '-e', `${base}:${file}`) === null,
	before: (file) => git('show', `${base}:${file}`),
	after: (file) => {
		try {
			return fs.readFileSync(path.join(projectDir, file), 'utf8')
		} catch {
			return null
		}
	},
	diff: (file) => git('diff', '-U0', base, '--', file),
})
const affected = new Set([...affectedCaptures(kept), ...added])
const ids = Object.keys(CAPTURES).filter((id) => affected.has(id))
const total = Object.keys(CAPTURES).length

if (ids.length === total) {
	console.log(`all ${total} captures: run without UI_CHECK_ONLY`)
} else if (!ids.length) {
	console.log('no capture covers this change')
} else {
	console.log(`${ids.length} of ${total} captures`)
	console.log(`UI_CHECK_ONLY=${ids.join(',')}`)
}
