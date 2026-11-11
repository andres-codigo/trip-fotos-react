import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
	changedRows,
	compareFolders,
	decodePng,
	encodePng,
	report,
	sheet,
	sheetGroups,
	stateOf,
	sideBySide,
	toRanges,
	writeCrops,
	writeSheets,
} from '../compare.mjs'

const WHITE = [255, 255, 255, 255]
const RED = [255, 0, 0, 255]

const image = (width, height, paint = () => WHITE) => {
	const data = Buffer.alloc(width * height * 4)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			data.set(paint(x, y), (y * width + x) * 4)
		}
	}
	return { width, height, data }
}

const gradient = (x, y) => [x * 40, y * 30, (x * y) % 256, 200 + x]

// Re-encodes an RGBA image with one PNG filter on every row, as encoders such as Chrome's do
const encodeFiltered = ({ width, height, data }, filter) => {
	const stride = width * 4
	const raw = Buffer.alloc((stride + 1) * height)
	for (let y = 0; y < height; y++) {
		const line = data.subarray(y * stride, (y + 1) * stride)
		const above =
			y > 0
				? data.subarray((y - 1) * stride, y * stride)
				: Buffer.alloc(stride)
		raw[y * (stride + 1)] = filter
		for (let i = 0; i < stride; i++) {
			const left = i >= 4 ? line[i - 4] : 0
			const up = above[i]
			const upLeft = i >= 4 ? above[i - 4] : 0
			const estimate = left + up - upLeft
			const [a, b, c] = [left, up, upLeft].map((value) =>
				Math.abs(estimate - value),
			)
			const predictor = [
				0,
				left,
				up,
				(left + up) >> 1,
				a <= b && a <= c ? left : b <= c ? up : upLeft,
			][filter]
			raw[y * (stride + 1) + 1 + i] = (line[i] - predictor) & 0xff
		}
	}
	const png = encodePng({ width, height, data })
	const idatStart = png.indexOf('IDAT') - 4
	const idatLength = png.readUInt32BE(idatStart)
	const body = zlib.deflateSync(raw)
	const length = Buffer.alloc(4)
	length.writeUInt32BE(body.length)
	const typed = Buffer.concat([Buffer.from('IDAT'), body])
	const crc = Buffer.alloc(4)
	crc.writeUInt32BE(zlib.crc32(typed))
	return Buffer.concat([
		png.subarray(0, idatStart),
		length,
		typed,
		crc,
		png.subarray(idatStart + 12 + idatLength),
	])
}

describe('ui-check compare', () => {
	describe('PNG decoding', () => {
		it('round-trips its own encoding', () => {
			const original = image(5, 4, gradient)

			expect(decodePng(encodePng(original))).toEqual(original)
		})

		it.each([1, 2, 3, 4])('reverses filter %i', (filter) => {
			const original = image(5, 4, gradient)

			expect(decodePng(encodeFiltered(original, filter))).toEqual(
				original,
			)
		})

		it('refuses a file that is not a PNG', () => {
			expect(() => decodePng(Buffer.from('not a png'))).toThrow(
				/Not a PNG/,
			)
		})
	})

	describe('changed rows', () => {
		it('lists only the rows whose pixels differ', () => {
			const before = image(4, 10)
			const after = image(4, 10, (x, y) =>
				(y >= 2 && y <= 3) || y === 7 ? RED : WHITE,
			)

			expect(toRanges(changedRows(before, after))).toEqual([
				[2, 3],
				[7, 7],
			])
		})

		it('counts the rows past the shorter image as changed', () => {
			expect(toRanges(changedRows(image(4, 5), image(4, 8)))).toEqual([
				[5, 7],
			])
		})

		it('finds no rows in identical pixels', () => {
			expect(changedRows(image(4, 5), image(4, 5))).toEqual([])
		})
	})

	it('crops both images side by side around the changed rows', () => {
		const before = image(3, 100)
		const after = image(2, 100, (x, y) => (y === 50 ? RED : WHITE))
		const crop = sideBySide(before, after, 50, 50)

		expect(crop.width).toBe(3 + 8 + 2)
		expect(crop.height).toBe(16 * 2 + 1)
		const pixel = (x, y) => [
			...crop.data.subarray(
				(y * crop.width + x) * 4,
				(y * crop.width + x) * 4 + 4,
			),
		]
		expect(pixel(11, 16)).toEqual(RED)
		expect(pixel(0, 16)).toEqual(WHITE)
	})

	describe('folders', () => {
		let root

		const write = (label, name, picture) => {
			const file = path.join(root, label, name)
			fs.mkdirSync(path.dirname(file), { recursive: true })
			fs.writeFileSync(file, encodePng(picture))
		}

		beforeEach(() => {
			root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-check-compare-'))
			write('main', 'same-390.png', image(4, 6))
			write('branch', 'same-390.png', image(4, 6))
			write('main', 'changed-390.png', image(4, 6))
			write(
				'branch',
				'changed-390.png',
				image(4, 6, (x, y) => (y === 4 ? RED : WHITE)),
			)
			write('main', 'gone-390.png', image(4, 6))
			write('branch', 'extra/new-390.png', image(4, 6))
		})

		afterEach(() => {
			fs.rmSync(root, { recursive: true, force: true })
		})

		it('sorts every pair into identical, changed, new and missing', () => {
			const result = compareFolders(
				path.join(root, 'main'),
				path.join(root, 'branch'),
			)

			expect(result.identical).toEqual(['same-390.png'])
			expect(
				result.changed.map(({ name, ranges }) => [name, ranges]),
			).toEqual([['changed-390.png', [[4, 4]]]])
			expect(result.added).toEqual(['extra/new-390.png'])
			expect(result.missing).toEqual(['gone-390.png'])
			expect(report(result, 'crops')).toBe(
				[
					'identical 1, changed 1, new 1, missing 1',
					'changed changed-390.png: 4x6 -> 4x6, rows 4',
					`  crop ${path.join('crops', 'changed-390.png')}`,
					'new extra/new-390.png',
					'missing gone-390.png',
				].join('\n'),
			)
		})

		it('treats files with equal pixels but different bytes as identical', () => {
			fs.writeFileSync(
				path.join(root, 'branch', 'same-390.png'),
				encodeFiltered(image(4, 6), 2),
			)

			const result = compareFolders(
				path.join(root, 'main'),
				path.join(root, 'branch'),
			)

			expect(result.identical).toContain('same-390.png')
		})

		it('writes a crop for each changed pair', () => {
			const cropDir = path.join(root, 'crops')
			const result = compareFolders(
				path.join(root, 'main'),
				path.join(root, 'branch'),
			)

			writeCrops(result, cropDir)

			const crop = decodePng(
				fs.readFileSync(path.join(cropDir, 'changed-390.png')),
			)
			expect(crop.width).toBe(4 + 8 + 4)
			expect(crop.height).toBe(6)
		})

		it('compares only the captures a filtered branch run took', () => {
			write('main', 'messages-states/messages-390.png', image(4, 6))
			write('main', 'edit-states/edit-390.png', image(4, 6))
			write('branch', 'edit-states/edit-390.png', image(4, 6))

			const result = compareFolders(
				path.join(root, 'main'),
				path.join(root, 'branch'),
			)

			expect(result.missing).toEqual(['gone-390.png'])
			expect(result.identical).toContain('edit-states/edit-390.png')
			expect(result.notRun).toBe(1)
			expect(report(result).split('\n')[0]).toMatch(
				/1 captures not run on this label/,
			)
		})

		it('writes one sheet per new or changed state with all its widths, narrowest first', () => {
			write('branch', 'changed-1280.png', image(5, 3))
			write('branch', 'extra/new-768.png', image(2, 8))
			const result = compareFolders(
				path.join(root, 'main'),
				path.join(root, 'branch'),
			)

			expect(
				sheetGroups(result, [
					'changed-1280.png',
					'changed-390.png',
					'extra/new-390.png',
					'extra/new-768.png',
					'same-390.png',
				]),
			).toEqual([
				{
					state: 'changed',
					names: ['changed-390.png', 'changed-1280.png'],
				},
				{
					state: 'extra/new',
					names: ['extra/new-390.png', 'extra/new-768.png'],
				},
			])

			const files = writeSheets(
				result,
				path.join(root, 'branch'),
				path.join(root, 'sheets'),
			)
			const changed = decodePng(fs.readFileSync(files[0]))
			expect(files.map((file) => path.relative(root, file))).toEqual([
				path.join('sheets', 'changed.png'),
				path.join('sheets', 'extra', 'new.png'),
			])
			expect([changed.width, changed.height]).toEqual([4 + 8 + 5, 6])
		})
	})

	it('names a state by its shot, without the width or the extension', () => {
		expect(stateOf('edit-states/edit-trip-390.png')).toBe(
			'edit-states/edit-trip',
		)
		expect(stateOf('edit-save/edit-trip-saving.png')).toBe(
			'edit-save/edit-trip-saving',
		)
	})

	it('pads a shorter image in a sheet with grey', () => {
		const tall = image(2, 4, () => RED)
		const short = image(2, 2, () => RED)
		const result = sheet([tall, short])
		const pixel = (x, y) => [
			...result.data.subarray(
				(y * result.width + x) * 4,
				(y * result.width + x) * 4 + 4,
			),
		]

		expect([result.width, result.height]).toEqual([2 + 8 + 2, 4])
		expect(pixel(10, 1)).toEqual(RED)
		expect(pixel(10, 3)).toEqual([128, 128, 128, 255])
		expect(pixel(3, 0)).toEqual([255, 0, 255, 255])
	})
})
