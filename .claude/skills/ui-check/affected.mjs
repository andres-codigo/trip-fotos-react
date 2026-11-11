// The captures the branch can affect: node affected.mjs. Prints the UI_CHECK_ONLY for both refs, or nothing when every capture is affected
import { CAPTURES, affectedCaptures } from '../../../cypress/impact.js'
import { branchFiles } from '../verify/git-tree.mjs'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const ids = affectedCaptures(branchFiles(projectDir))
const total = Object.keys(CAPTURES).length

if (ids.length === total) {
	console.log(`all ${total} captures: run without UI_CHECK_ONLY`)
} else if (!ids.length) {
	console.log('no capture covers this change')
} else {
	console.log(`${ids.length} of ${total} captures`)
	console.log(`UI_CHECK_ONLY=${ids.join(',')}`)
}
