import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { CAPTURES, E2E_SPECS, affectedCaptures, affectedSpecs } from '../impact'

const root = path.resolve(import.meta.dirname, '../..')

describe('the impact manifest', () => {
	it('names every capture in capture.cy.js, and nothing else', () => {
		const script = fs.readFileSync(
			path.join(root, 'cypress/ui-check/capture.cy.js'),
			'utf8',
		)
		const ids = [...script.matchAll(/^\t\tcapture\(\s*'([\w-]+)'/gm)].map(
			([, id]) => id,
		)

		expect(ids.sort()).toEqual(Object.keys(CAPTURES).sort())
	})

	it('names every E2E spec, and nothing else', () => {
		const specs = fs
			.globSync('cypress/e2e/**/*.cy.js', { cwd: root })
			.sort()

		expect(Object.keys(E2E_SPECS).sort()).toEqual(specs)
	})
})

describe('affectedCaptures', () => {
	it('runs only the captures of the page a change touches', () => {
		expect(affectedCaptures(['src/pages/messages/Messages.jsx'])).toEqual([
			'messages-states',
			'messages-empty',
		])
	})

	it('reads a component folder as the area that owns it', () => {
		const ids = affectedCaptures([
			'src/components/forms/trip-photos/TripPhotos.jsx',
		])

		expect(ids).toContain('edit-states')
		expect(ids).not.toContain('messages-states')
		expect(ids).not.toContain('register-files')
	})

	it('runs every capture for a shared file no area claims', () => {
		for (const file of [
			'src/components/ui/button/BaseButton.jsx',
			'src/styles/index.css',
			'src/components/layout/header/Header.jsx',
		]) {
			expect(affectedCaptures([file])).toEqual(Object.keys(CAPTURES))
		}
	})

	it('runs every capture when the capture script or the seed changes', () => {
		expect(affectedCaptures(['scripts/seed-emulators.mjs'])).toHaveLength(
			Object.keys(CAPTURES).length,
		)
	})

	it('ignores tests, test ids and files outside the app', () => {
		expect(
			affectedCaptures([
				'src/pages/messages/__tests__/Messages.test.jsx',
				'src/components/ui/button/__tests__/BaseButton.cy.jsx',
				'src/constants/test/ui-constants.js',
				'README.md',
			]),
		).toEqual([])
	})
})

describe('affectedSpecs', () => {
	it('runs the specs for the page a change touches', () => {
		expect(affectedSpecs(['src/pages/edit-trip/EditTrip.jsx'])).toEqual([
			'cypress/e2e/pages/EditTrip.cy.js',
		])
	})

	it('runs a changed spec even when no app file changed', () => {
		expect(affectedSpecs(['cypress/e2e/pages/Privacy.cy.js'])).toEqual([
			'cypress/e2e/pages/Privacy.cy.js',
		])
	})

	it('runs every spec when the support code or a shared file changes', () => {
		const all = Object.keys(E2E_SPECS)

		expect(affectedSpecs(['cypress/support/commands.js'])).toEqual(all)
		expect(affectedSpecs(['src/app/App.jsx'])).toEqual(all)
	})
})
