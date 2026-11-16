// Whether the `main` captures can be reused: node main-captures.mjs [UI_CHECK_WIDTHS] [UI_CHECK_ONLY]
// Exit 0 reuses them; exit 1 prints why, and the UI_CHECK_ONLY that retakes just the captures missing.
// When main has moved, the record first moves with it, dropping only the captures the commits between can change
import { execFileSync, execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { CAPTURES, affectedCaptures } from '../../../cypress/impact.js'
import {
	parseOnly,
	parseWidthSpec,
	runsCapture,
	widthsFor,
} from '../../../cypress/ui-check/selection.js'
import { narrowChange } from './narrow.mjs'

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

// `read` returns a file's content, from the working tree by default or from a commit
export const scriptHash = (
	projectDir,
	read = (file) => fs.readFileSync(path.join(projectDir, file)),
) => {
	const hash = crypto.createHash('sha256')
	for (const file of SCRIPT_FILES) hash.update(file).update(read(file))
	return hash.digest('hex')
}

// Files outside src/ that change every page: the HTML shell, the build, static assets, the rules and the emulator env
const APP_FILES = [
	'index.html',
	'vite.config.js',
	'public/',
	'firebase/',
	'.env.emulators',
]
const PACKAGE_FILES = ['package.json', 'package-lock.json']

// The package files with their own version left out, which a release commit bumps and nothing renders
const withoutVersion = (text) => {
	const json = JSON.parse(text)
	delete json.version
	delete json.packages?.['']?.version
	return JSON.stringify(json)
}

const onlyVersionChanged = (before, after) => {
	try {
		return withoutVersion(before) === withoutVersion(after)
	} catch {
		return false
	}
}

// The captures the files changed between two main commits can change, or null when they can change them all.
// `git` answers per file as narrowChange expects; a release, docs or test commit changes none
export const staleCaptures = (files, git) => {
	if (files.some((file) => APP_FILES.some((app) => file.startsWith(app)))) {
		return null
	}
	const changedPackage = files.some(
		(file) =>
			PACKAGE_FILES.includes(file) &&
			!onlyVersionChanged(git.before(file), git.after(file)),
	)
	if (changedPackage) return null
	const { kept, added } = narrowChange(files, git)
	const affected = new Set([...affectedCaptures(kept), ...added])
	const ids = Object.keys(CAPTURES).filter((id) => affected.has(id))
	return ids.length === Object.keys(CAPTURES).length ? null : ids
}

// The record on a newer main commit, keeping only the captures nothing between them can change
export const moveStamp = (stamp, { commit, script, stale }) => ({
	commit,
	script,
	captures: stale
		? Object.fromEntries(
				Object.entries(stamp.captures).filter(
					([id]) => !stale.includes(id),
				),
			)
		: {},
})

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

// Reads a file at a commit, or null when it is not there
const showAt = (projectDir, commit, file) => {
	try {
		return execFileSync('git', ['show', `${commit}:${file}`], {
			cwd: projectDir,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		})
	} catch {
		return null
	}
}

// Moves the record to `commit` and says what it dropped; leaves it alone when git cannot read the recorded commit
const followMain = (projectDir, file, stamp, commit) => {
	let files
	try {
		files = git(
			`diff --no-renames --name-only ${stamp.commit} ${commit}`,
			projectDir,
		)
			.split('\n')
			.filter(Boolean)
	} catch {
		return stamp
	}
	const stale = staleCaptures(files, {
		isNew: (name) => showAt(projectDir, stamp.commit, name) === null,
		before: (name) => showAt(projectDir, stamp.commit, name),
		after: (name) => showAt(projectDir, commit, name),
		diff: (name) =>
			git(`diff -U0 ${stamp.commit} ${commit} -- ${name}`, projectDir),
	})
	const moved = moveStamp(stamp, {
		commit,
		script: scriptHash(
			projectDir,
			(name) => showAt(projectDir, commit, name) ?? '',
		),
		stale,
	})
	fs.writeFileSync(file, JSON.stringify(moved))
	const from = `${stamp.commit.slice(0, 7)} to ${commit.slice(0, 7)}`
	console.log(
		`main moved from ${from}: ${
			stale === null
				? 'every capture can change'
				: stale.length
					? `${stale.join(', ')} can change`
					: 'no capture can change'
		}`,
	)
	return moved
}

const main = () => {
	const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
	const [widths, only] = process.argv.slice(2)
	const file = stampPath(capturesDir(projectDir))
	const commit = git('rev-parse main', projectDir)
	let stamp = readStamp(file)
	if (stamp?.captures && stamp.commit !== commit) {
		stamp = followMain(projectDir, file, stamp, commit)
	}
	const { reuse, reason, retake } = reuseVerdict(stamp, {
		commit,
		script: scriptHash(projectDir),
		needed: neededWidths(widths, only),
	})
	console.log(`${reuse ? 'reuse' : 'recapture'}: ${reason}`)
	if (!reuse) console.log(`UI_CHECK_ONLY=${retake.join(',')}`)
	process.exit(reuse ? 0 : 1)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
