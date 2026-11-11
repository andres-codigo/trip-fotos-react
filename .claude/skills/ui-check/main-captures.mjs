// Whether the `main` captures can be reused: node main-captures.mjs [UI_CHECK_WIDTHS] [UI_CHECK_ONLY]
// Exit 0 reuses them; exit 1 prints why, and the UI_CHECK_ONLY that retakes just the captures missing
import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { CAPTURES } from '../../../cypress/impact.js'
import {
	parseOnly,
	parseWidthSpec,
	runsCapture,
	widthsFor,
} from '../../../cypress/ui-check/selection.js'

export const MAIN_LABEL = 'main'
// Outside cypress/screenshots, which a component or E2E run trashes
export const CAPTURES_ROOT = path.join('cypress', 'ui-check-captures')
// What decides the images besides the app: the capture script, its helpers and the seed data
const SCRIPT_FILES = [
	'cypress/ui-check/capture.cy.js',
	'cypress/ui-check/selection.js',
	'cypress/impact.js',
	'cypress/support/utils/waitForSuccess.js',
	'scripts/seed-emulators.mjs',
]

export const capturesDir = (projectDir) =>
	path.join(projectDir, CAPTURES_ROOT, 'capture.cy.js')

export const scriptHash = (projectDir) => {
	const hash = crypto.createHash('sha256')
	for (const file of SCRIPT_FILES) {
		hash.update(file).update(fs.readFileSync(path.join(projectDir, file)))
	}
	return hash.digest('hex')
}

export const stampPath = (dir, label = MAIN_LABEL) =>
	path.join(dir, `${label}.json`)

const git = (args, cwd) =>
	execSync(`git ${args}`, { cwd, encoding: 'utf8' }).trim()

const idByTitle = Object.fromEntries(
	Object.entries(CAPTURES).map(([id, { title }]) => [title, id]),
)

// The captures a run took, with their widths, from Cypress's after:run results; a failed capture is left out
export const capturedWidths = (results, widths) => {
	const spec = parseWidthSpec(widths)
	return Object.fromEntries(
		(results?.runs ?? [])
			.flatMap(({ tests }) => tests ?? [])
			.filter(({ state }) => state === 'passed')
			.map(({ title }) => idByTitle[title.at(-1)])
			.filter(Boolean)
			.map((id) => [id, widthsFor(spec, id, CAPTURES[id].title)]),
	)
}

// The captures a run asks for, with their widths
export const neededWidths = (widths, only) => {
	const spec = parseWidthSpec(widths)
	const parts = parseOnly(only)
	return Object.fromEntries(
		Object.entries(CAPTURES)
			.filter(([id, { title }]) => runsCapture(parts, id, title))
			.map(([id, { title }]) => [id, widthsFor(spec, id, title)]),
	)
}

// A run on the same commit and script adds to the record; any other replaces it
export const mergeStamp = (stamp, run) => ({
	commit: run.commit,
	script: run.script,
	captures: {
		...(stamp?.commit === run.commit && stamp?.script === run.script
			? stamp.captures
			: {}),
		...run.captures,
	},
})

export const reuseVerdict = (stamp, current) => {
	const all = Object.keys(current.needed)
	if (!stamp?.captures)
		return { reuse: false, reason: 'no main capture recorded', retake: all }
	if (stamp.commit !== current.commit) {
		return {
			reuse: false,
			reason: `main moved from ${stamp.commit.slice(0, 7)} to ${current.commit.slice(0, 7)}`,
			retake: all,
		}
	}
	if (stamp.script !== current.script) {
		return {
			reuse: false,
			reason: 'the capture script or seed data changed',
			retake: all,
		}
	}
	const retake = all.filter((id) =>
		current.needed[id].some(
			(width) => !stamp.captures[id]?.includes(width),
		),
	)
	if (retake.length) {
		return {
			reuse: false,
			reason: `main lacks ${retake.join(', ')} at these widths`,
			retake,
		}
	}
	return {
		reuse: true,
		reason: `main captures at ${stamp.commit.slice(0, 7)} match`,
		retake: [],
	}
}

const readStamp = (file) => {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

// Only a main run of committed app code describes that commit
export const writeStamp = ({ projectDir, dir, label, results, widths }) => {
	if (label !== MAIN_LABEL) return false
	const dirty = git(
		'status --porcelain -- src public index.html vite.config.js',
		projectDir,
	)
	const captures = capturedWidths(results, widths)
	if (dirty || !Object.keys(captures).length) return false
	const file = stampPath(dir)
	fs.writeFileSync(
		file,
		JSON.stringify(
			mergeStamp(readStamp(file), {
				commit: git('rev-parse HEAD', projectDir),
				script: scriptHash(projectDir),
				captures,
			}),
		),
	)
	return true
}

const main = () => {
	const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
	const [widths, only] = process.argv.slice(2)
	const { reuse, reason, retake } = reuseVerdict(
		readStamp(stampPath(capturesDir(projectDir))),
		{
			commit: git('rev-parse main', projectDir),
			script: scriptHash(projectDir),
			needed: neededWidths(widths, only),
		},
	)
	console.log(`${reuse ? 'reuse' : 'recapture'}: ${reason}`)
	if (!reuse) console.log(`UI_CHECK_ONLY=${retake.join(',')}`)
	process.exit(reuse ? 0 : 1)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
