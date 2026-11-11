import { describe, expect, it } from 'vitest'

import {
	capturedWidths,
	mergeStamp,
	neededWidths,
	reuseVerdict,
} from '../main-captures.mjs'
import { CAPTURES } from '../../../../cypress/impact.js'

const COMMIT = 'a'.repeat(40)
const stamp = {
	commit: COMMIT,
	script: 'script-hash',
	captures: {
		'public-pages': [390, 768, 1280],
		'edit-states': [390, 1280],
	},
}
const current = (needed, change = {}) => ({
	commit: COMMIT,
	script: 'script-hash',
	needed,
	...change,
})

describe('reusing the main captures', () => {
	it('reuses them when every needed capture was taken at its widths', () => {
		expect(
			reuseVerdict(stamp, current({ 'public-pages': [390, 1280] })),
		).toMatchObject({ reuse: true, retake: [] })
	})

	it.each([
		['nothing was recorded', null, {}, /no main capture/],
		[
			'main has moved',
			stamp,
			{ commit: 'b'.repeat(40) },
			/main moved from aaaaaaa to bbbbbbb/,
		],
		['the script changed', stamp, { script: 'other' }, /capture script/],
	])('retakes all of them when %s', (_, recorded, change, reason) => {
		const needed = { 'public-pages': [390], 'edit-states': [390] }
		const verdict = reuseVerdict(recorded, current(needed, change))

		expect(verdict.reuse).toBe(false)
		expect(verdict.reason).toMatch(reason)
		expect(verdict.retake).toEqual(['public-pages', 'edit-states'])
	})

	it('retakes only the captures missing or lacking a width', () => {
		const verdict = reuseVerdict(
			stamp,
			current({
				'public-pages': [390],
				'edit-states': [390, 768],
				'messages-empty': [390],
			}),
		)

		expect(verdict.reuse).toBe(false)
		expect(verdict.retake).toEqual(['edit-states', 'messages-empty'])
	})
})

describe('recording the main captures', () => {
	const results = (...tests) => ({ runs: [{ tests }] })
	const test = (id, state = 'passed') => ({
		title: ['UI check capture (main)', 'a context', CAPTURES[id].title],
		state,
	})

	it('records each passed capture with its widths, never a failed or skipped one', () => {
		expect(
			capturedWidths(
				results(
					test('public-pages'),
					test('edit-states'),
					test('messages-empty', 'failed'),
					test('own-trip', 'pending'),
				),
				'390,1280;edit=390,768,1280',
			),
		).toEqual({
			'public-pages': [390, 1280],
			'edit-states': [390, 768, 1280],
		})
	})

	it('adds a run on the same commit and script to the record', () => {
		const run = {
			commit: COMMIT,
			script: 'script-hash',
			captures: { 'edit-states': [390, 768] },
		}

		expect(mergeStamp(stamp, run).captures).toEqual({
			'public-pages': [390, 768, 1280],
			'edit-states': [390, 768],
		})
	})

	it('replaces the record after main or the script moved', () => {
		const run = {
			commit: 'b'.repeat(40),
			script: 'script-hash',
			captures: { 'edit-states': [390] },
		}

		expect(mergeStamp(stamp, run).captures).toEqual({
			'edit-states': [390],
		})
	})

	it('asks for every capture at the default widths, or the filtered ones at theirs', () => {
		const all = neededWidths(undefined, '')

		expect(Object.keys(all)).toEqual(Object.keys(CAPTURES))
		expect(all['public-pages']).toEqual([390, 1280])
		expect(neededWidths('390;edit-save=768', 'edit-save')).toEqual({
			'edit-save': [768],
		})
	})
})
