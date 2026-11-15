import { describe, expect, it } from 'vitest'

import {
	changedCaptures,
	narrowChange,
	onlyAddsExposeKeys,
} from '../narrow.mjs'
import { CAPTURES, affectedCaptures } from '../../../../cypress/impact.js'

const script = ({ imports = '', helpers = '', hooks = '', captures = '' }) =>
	[
		`import { PATHS } from '../../src/constants/ui/paths'${imports}`,
		'',
		'const visit = (path) => cy.visit(path)',
		helpers,
		'',
		'describe(`UI check capture`, () => {',
		'\tbeforeEach(() => {',
		"\t\tcy.task('resetEmulatorData')",
		'\t})',
		hooks,
		'',
		"\tcontext('public pages', () => {",
		"\t\tcapture('public-pages', () => {",
		'\t\t\tvisit(PATHS.HOME)',
		'\t\t})',
		captures,
		'\t})',
		'})',
	].join('\n')

const NEW_CAPTURE = [
	'',
	"\t\tcapture('verify-inbox', () => {",
	'\t\t\tvisitInbox()',
	'\t\t})',
].join('\n')

describe('changedCaptures', () => {
	const before = script({})

	it('selects only the captures an additive change adds', () => {
		const after = script({
			imports:
				"\nimport { SESSION_STORAGE_KEYS } from '../../src/constants/auth'",
			helpers:
				'// Opens the inbox\nconst visitInbox = () => visit(PATHS.HOME)',
			captures: NEW_CAPTURE,
		})

		expect(changedCaptures(before, after)).toEqual(['verify-inbox'])
	})

	it('reads a name added to an existing import as additive', () => {
		const after = script({ captures: NEW_CAPTURE }).replace(
			'import { PATHS }',
			'import {\n\tAUTH_PATHS,\n\tPATHS,\n}',
		)

		expect(changedCaptures(before, after)).toEqual(['verify-inbox'])
	})

	it('ignores a comment-only edit', () => {
		expect(
			changedCaptures(
				before,
				`// Captures\n${before}`.replace(
					'\t\t\tvisit(',
					'\t\t\t// Home\n\t\t\tvisit(',
				),
			),
		).toEqual([])
	})

	it('selects only the capture an edit changes, beside the ones it adds', () => {
		const edited = (text) =>
			text.replace('PATHS.HOME)\n\t\t})', 'PATHS.ROOT)\n\t\t})')

		expect(changedCaptures(before, edited(before))).toEqual([
			'public-pages',
		])
		expect(
			changedCaptures(before, edited(script({ captures: NEW_CAPTURE }))),
		).toEqual(['public-pages', 'verify-inbox'])
	})

	it('selects nothing for a removed capture', () => {
		const withTwo = script({ captures: NEW_CAPTURE })

		expect(changedCaptures(withTwo, before)).toEqual([])
	})

	it('runs everything when a shared helper changes beside an edited capture', () => {
		expect(
			changedCaptures(
				before,
				before
					.replace('PATHS.HOME)\n\t\t})', 'PATHS.ROOT)\n\t\t})')
					.replace(
						'cy.visit(path)',
						'cy.visit(path, { log: false })',
					),
			),
		).toBeNull()
	})

	it('runs everything when a shared helper changes or goes', () => {
		expect(
			changedCaptures(
				before,
				before.replace(
					'cy.visit(path)',
					'cy.visit(path, { log: false })',
				),
			),
		).toBeNull()
		expect(
			changedCaptures(
				before,
				before.replace('const visit = (path) => cy.visit(path)', ''),
			),
		).toBeNull()
	})

	it('runs everything when a line is added inside a shared helper or hook', () => {
		expect(
			changedCaptures(
				before,
				before.replace(
					"\t\tcy.task('resetEmulatorData')",
					"\t\tcy.task('resetEmulatorData')\n\t\tcy.clearCookies()",
				),
			),
		).toBeNull()
	})

	it('runs everything when a new hook joins the captures already there', () => {
		expect(
			changedCaptures(
				before,
				script({ hooks: '\tafterEach(() => cy.clearCookies())' }),
			),
		).toBeNull()
	})

	it('runs everything when the script is new or removed', () => {
		expect(changedCaptures(null, before)).toBeNull()
		expect(changedCaptures(before, null)).toBeNull()
	})
})

const CONFIG = [
	'export default defineConfig({',
	'\texpose: {',
	'\t\tAPI_URL: process.env.VITE_API_URL,',
	'\t},',
	'\te2e: {',
	"\t\tbaseUrl: 'http://localhost:3000',",
	'\t},',
	'})',
].join('\n')

describe('onlyAddsExposeKeys', () => {
	it('accepts lines added inside expose', () => {
		const after = CONFIG.replace(
			'VITE_API_URL,',
			'VITE_API_URL,\n\t\tAPI_KEY: process.env.VITE_API_KEY,',
		)

		expect(
			onlyAddsExposeKeys(
				'@@ -3,0 +4 @@\n+\t\tAPI_KEY: process.env.VITE_API_KEY,',
				after,
			),
		).toBe(true)
	})

	it('rejects an added line outside expose', () => {
		const after = CONFIG.replace("3000',", "3000',\n\t\tvideo: true,")

		expect(
			onlyAddsExposeKeys('@@ -6,0 +7 @@\n+\t\tvideo: true,', after),
		).toBe(false)
	})

	it('rejects a changed or removed line, even inside expose', () => {
		expect(
			onlyAddsExposeKeys(
				'@@ -3 +3 @@\n-\t\tAPI_URL: a,\n+\t\tAPI_URL: b,',
				CONFIG,
			),
		).toBe(false)
		expect(
			onlyAddsExposeKeys('@@ -3 +2,0 @@\n-\t\tAPI_URL: a,', CONFIG),
		).toBe(false)
	})

	it('rejects a missing diff', () => {
		expect(onlyAddsExposeKeys(null, CONFIG)).toBe(false)
	})
})

describe('narrowChange', () => {
	const git = (overrides = {}) => ({
		isNew: () => false,
		before: () => null,
		after: () => null,
		diff: () => null,
		...overrides,
	})

	it('drops constants a change only adds to, and keeps one it edits', () => {
		const diffs = {
			'src/constants/auth/index.js':
				'--- a/x\n+++ b/x\n@@ -1,0 +2 @@\n+export const A = 1',
			'src/constants/ui/paths.js':
				'--- a/x\n+++ b/x\n@@ -2 +2 @@\n-\tHOME: "/",\n+\tHOME: "/home",',
		}

		expect(
			narrowChange(
				Object.keys(diffs),
				git({ diff: (file) => diffs[file] }),
			).kept,
		).toEqual(['src/constants/ui/paths.js'])
	})

	it('drops a new src file, which reaches a page only through a changed importer', () => {
		expect(
			narrowChange(
				['src/components/ui/inline-alert/InlineAlert.jsx'],
				git({ isNew: () => true }),
			).kept,
		).toEqual([])
	})

	it('keeps an edited shared file', () => {
		expect(narrowChange(['src/app/App.jsx'], git()).kept).toEqual([
			'src/app/App.jsx',
		])
	})

	it('keeps the capture script and config when they change more than they add', () => {
		expect(
			narrowChange(
				['cypress/ui-check/capture.cy.js', 'cypress.config.js'],
				git(),
			).kept,
		).toEqual(['cypress/ui-check/capture.cy.js', 'cypress.config.js'])
	})

	it('selects only the auth and header captures for a branch shaped like #766', () => {
		const before = script({})
		const files = {
			'cypress/ui-check/capture.cy.js': {
				before,
				after: script({
					helpers: 'const visitInbox = () => visit(PATHS.HOME)',
					captures: NEW_CAPTURE,
				}),
			},
			'cypress.config.js': {
				after: CONFIG.replace(
					'VITE_API_URL,',
					'VITE_API_URL,\n\t\tAPI_KEY: process.env.VITE_API_KEY,',
				),
				diff: '@@ -3,0 +4 @@\n+\t\tAPI_KEY: process.env.VITE_API_KEY,',
			},
			'src/constants/auth/index.js': {
				diff: '@@ -1,0 +2 @@\n+export const A = 1',
			},
			'src/constants/ui/paths.js': {
				diff: '@@ -1,0 +2 @@\n+\tAUTH_ACTION: "/auth/action",',
			},
			'src/pages/auth-action/AuthAction.jsx': { isNew: true },
			'src/components/ui/inline-alert/InlineAlert.jsx': { isNew: true },
			'src/pages/authentication/Authentication.jsx': {},
			'src/components/layout/header/Header.jsx': {},
		}
		const { kept, added } = narrowChange(Object.keys(files), {
			isNew: (file) => Boolean(files[file].isNew),
			before: (file) => files[file].before ?? null,
			after: (file) => files[file].after ?? null,
			diff: (file) => files[file].diff ?? null,
		})
		const ids = new Set([...affectedCaptures(kept), ...added])

		expect(added).toEqual(['verify-inbox'])
		expect(Object.keys(CAPTURES).filter((id) => ids.has(id))).toEqual(
			Object.keys(CAPTURES).filter(
				(id) =>
					CAPTURES[id].areas.includes('authentication') ||
					CAPTURES[id].areas.includes('header'),
			),
		)
		expect(ids.size).toBeLessThan(Object.keys(CAPTURES).length)
	})
})
