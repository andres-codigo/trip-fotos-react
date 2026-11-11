// Whether the `main` captures can be reused: node main-captures.mjs [widths]
// Exit 0 reuses them; exit 1 prints why they must be retaken
import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const DEFAULT_WIDTHS = '390,1280'
export const MAIN_LABEL = 'main'
// What decides the images besides the app: the capture script, its helpers and the seed data
const SCRIPT_FILES = [
	'cypress/ui-check/capture.cy.js',
	'cypress/ui-check/only.js',
	'scripts/seed-emulators.mjs',
]

export const parseWidths = (widths) =>
	String(widths || DEFAULT_WIDTHS)
		.split(',')
		.map(Number)
		.filter(Boolean)

export const scriptHash = (projectDir) => {
	const hash = crypto.createHash('sha256')
	for (const file of SCRIPT_FILES) {
		hash.update(file).update(fs.readFileSync(path.join(projectDir, file)))
	}
	return hash.digest('hex')
}

export const stampPath = (capturesDir, label = MAIN_LABEL) =>
	path.join(capturesDir, `${label}.json`)

const git = (args, cwd) =>
	execSync(`git ${args}`, { cwd, encoding: 'utf8' }).trim()

// Only a full, passing `main` run on a commit with no uncommitted app change describes that commit
export const shouldStamp = ({ label, only, failed, dirty }) =>
	label === MAIN_LABEL && !String(only ?? '').trim() && !failed && !dirty

export const writeStamp = ({
	projectDir,
	capturesDir,
	label,
	only,
	failed,
	widths,
}) => {
	const dirty = Boolean(
		git(
			'status --porcelain -- src public index.html vite.config.js',
			projectDir,
		),
	)
	if (!shouldStamp({ label, only, failed, dirty })) return false
	fs.writeFileSync(
		stampPath(capturesDir),
		JSON.stringify({
			commit: git('rev-parse HEAD', projectDir),
			script: scriptHash(projectDir),
			widths: parseWidths(widths),
		}),
	)
	return true
}

export const reuseVerdict = (stamp, current) => {
	if (!stamp) return { reuse: false, reason: 'no full main capture recorded' }
	if (stamp.commit !== current.commit) {
		return {
			reuse: false,
			reason: `main moved from ${stamp.commit.slice(0, 7)} to ${current.commit.slice(0, 7)}`,
		}
	}
	if (stamp.script !== current.script) {
		return {
			reuse: false,
			reason: 'the capture script or seed data changed',
		}
	}
	const missing = current.widths.filter(
		(width) => !stamp.widths.includes(width),
	)
	if (missing.length) {
		return {
			reuse: false,
			reason: `main was not captured at ${missing.join(', ')}px`,
		}
	}
	return {
		reuse: true,
		reason: `main captures at ${stamp.commit.slice(0, 7)} match`,
	}
}

const readStamp = (file) => {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

const main = () => {
	const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
	const capturesDir = path.join(
		projectDir,
		'cypress',
		'screenshots',
		'capture.cy.js',
	)
	const { reuse, reason } = reuseVerdict(readStamp(stampPath(capturesDir)), {
		commit: git('rev-parse main', projectDir),
		script: scriptHash(projectDir),
		widths: parseWidths(process.argv[2]),
	})
	console.log(`${reuse ? 'reuse' : 'recapture'}: ${reason}`)
	process.exit(reuse ? 0 : 1)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
