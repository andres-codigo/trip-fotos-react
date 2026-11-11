// Compares two /ui-check capture folders: node compare.mjs [main label] [branch label]
// Lists identical, changed, new and missing shots, prints the changed rows of each changed pair and writes a side-by-side crop of the changed region
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 }
const GAP = 8
const PADDING = 16
const GAP_COLOUR = [255, 0, 255, 255]
const EMPTY_COLOUR = [128, 128, 128, 255]

const paeth = (left, up, upLeft) => {
	const estimate = left + up - upLeft
	const toLeft = Math.abs(estimate - left)
	const toUp = Math.abs(estimate - up)
	const toUpLeft = Math.abs(estimate - upLeft)
	if (toLeft <= toUp && toLeft <= toUpLeft) return left
	return toUp <= toUpLeft ? up : upLeft
}

const unfilter = (filter, line, previous, bpp) => {
	for (let i = 0; i < line.length; i++) {
		const left = i >= bpp ? line[i - bpp] : 0
		const up = previous[i]
		const upLeft = i >= bpp ? previous[i - bpp] : 0
		const add = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][
			filter
		]
		if (add === undefined) throw new Error(`Unknown PNG filter ${filter}`)
		line[i] = (line[i] + add) & 0xff
	}
}

// 8-bit, non-interlaced greyscale, RGB or RGBA, which is what Cypress writes; always returns RGBA
export const decodePng = (buffer) => {
	if (!buffer.subarray(0, 8).equals(SIGNATURE)) {
		throw new Error('Not a PNG file')
	}
	let offset = 8
	let header
	const data = []
	while (offset < buffer.length) {
		const length = buffer.readUInt32BE(offset)
		const type = buffer.toString('latin1', offset + 4, offset + 8)
		const body = buffer.subarray(offset + 8, offset + 8 + length)
		if (type === 'IHDR') {
			header = {
				width: body.readUInt32BE(0),
				height: body.readUInt32BE(4),
				bitDepth: body[8],
				colourType: body[9],
				interlace: body[12],
			}
		} else if (type === 'IDAT') {
			data.push(body)
		} else if (type === 'IEND') {
			break
		}
		offset += 12 + length
	}
	const channels = CHANNELS[header?.colourType]
	if (!header || header.bitDepth !== 8 || !channels || header.interlace) {
		throw new Error('Unsupported PNG: only 8-bit, non-interlaced')
	}
	const { width, height } = header
	const raw = zlib.inflateSync(Buffer.concat(data))
	const stride = width * channels
	const pixels = Buffer.alloc(width * height * 4)
	let previous = Buffer.alloc(stride)
	for (let y = 0; y < height; y++) {
		const start = y * (stride + 1)
		const line = Buffer.from(raw.subarray(start + 1, start + 1 + stride))
		unfilter(raw[start], line, previous, channels)
		for (let x = 0; x < width; x++) {
			const source = x * channels
			const target = (y * width + x) * 4
			const grey = channels < 3
			pixels[target] = line[source]
			pixels[target + 1] = grey ? line[source] : line[source + 1]
			pixels[target + 2] = grey ? line[source] : line[source + 2]
			pixels[target + 3] =
				channels === 4
					? line[source + 3]
					: channels === 2
						? line[source + 1]
						: 255
		}
		previous = line
	}
	return { width, height, data: pixels }
}

const chunk = (type, body) => {
	const length = Buffer.alloc(4)
	length.writeUInt32BE(body.length)
	const typed = Buffer.concat([Buffer.from(type, 'latin1'), body])
	const crc = Buffer.alloc(4)
	crc.writeUInt32BE(zlib.crc32(typed))
	return Buffer.concat([length, typed, crc])
}

export const encodePng = ({ width, height, data }) => {
	const stride = width * 4
	const raw = Buffer.alloc((stride + 1) * height)
	for (let y = 0; y < height; y++) {
		data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
	}
	const header = Buffer.alloc(13)
	header.writeUInt32BE(width, 0)
	header.writeUInt32BE(height, 4)
	header[8] = 8
	header[9] = 6
	return Buffer.concat([
		SIGNATURE,
		chunk('IHDR', header),
		chunk('IDAT', zlib.deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0)),
	])
}

const row = (image, y) =>
	y < image.height
		? image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4)
		: null

// A row missing from the shorter image counts as changed, and so does every row when the widths differ
export const changedRows = (before, after) => {
	const rows = []
	const height = Math.max(before.height, after.height)
	for (let y = 0; y < height; y++) {
		const a = row(before, y)
		const b = row(after, y)
		if (!a || !b || !a.equals(b)) rows.push(y)
	}
	return rows
}

export const toRanges = (rows) =>
	rows.reduce((ranges, y) => {
		const last = ranges.at(-1)
		if (last && last[1] === y - 1) last[1] = y
		else ranges.push([y, y])
		return ranges
	}, [])

const formatRanges = (ranges) =>
	ranges
		.map(([start, end]) => (start === end ? `${start}` : `${start}–${end}`))
		.join(', ')

// Before on the left, after on the right, rows `first` to `last` plus padding; rows past an image's end are grey
export const sideBySide = (before, after, first, last) => {
	const top = Math.max(0, first - PADDING)
	const bottom = Math.min(
		Math.max(before.height, after.height) - 1,
		last + PADDING,
	)
	const height = bottom - top + 1
	const width = before.width + GAP + after.width
	const data = Buffer.alloc(width * height * 4)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const target = (y * width + x) * 4
			const isAfter = x >= before.width + GAP
			const image = isAfter ? after : before
			const sourceX = isAfter ? x - before.width - GAP : x
			const sourceY = top + y
			if (!isAfter && x >= before.width) {
				data.set(GAP_COLOUR, target)
			} else if (sourceY >= image.height) {
				data.set(EMPTY_COLOUR, target)
			} else {
				const source = (sourceY * image.width + sourceX) * 4
				image.data.copy(data, target, source, source + 4)
			}
		}
	}
	return { width, height, data }
}

const listPngs = (dir, prefix = '') =>
	fs.existsSync(dir)
		? fs
				.readdirSync(dir, { withFileTypes: true })
				.flatMap((entry) =>
					entry.isDirectory()
						? listPngs(
								path.join(dir, entry.name),
								`${prefix}${entry.name}/`,
							)
						: entry.name.endsWith('.png')
							? [`${prefix}${entry.name}`]
							: [],
				)
				.sort()
		: []

const hash = (file) =>
	crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

// Byte-identical pairs are compared by hash alone; a pair that differs only in its bytes, not its pixels, counts as identical
export const compareFolders = (beforeDir, afterDir) => {
	const before = listPngs(beforeDir)
	const after = new Set(listPngs(afterDir))
	const result = { identical: [], changed: [], added: [], missing: [] }
	for (const name of before) {
		if (!after.has(name)) {
			result.missing.push(name)
			continue
		}
		after.delete(name)
		const a = path.join(beforeDir, name)
		const b = path.join(afterDir, name)
		if (hash(a) === hash(b)) {
			result.identical.push(name)
			continue
		}
		const imageA = decodePng(fs.readFileSync(a))
		const imageB = decodePng(fs.readFileSync(b))
		const rows = changedRows(imageA, imageB)
		if (!rows.length) {
			result.identical.push(name)
			continue
		}
		result.changed.push({
			name,
			before: imageA,
			after: imageB,
			ranges: toRanges(rows),
		})
	}
	result.added = [...after]
	return result
}

const size = ({ width, height }) => `${width}x${height}`

export const report = (result, cropDir) => {
	const lines = [
		`identical ${result.identical.length}, changed ${result.changed.length}, new ${result.added.length}, missing ${result.missing.length}`,
	]
	for (const { name, before, after, ranges } of result.changed) {
		lines.push(
			`changed ${name}: ${size(before)} -> ${size(after)}, rows ${formatRanges(ranges)}`,
		)
		if (cropDir) lines.push(`  crop ${path.join(cropDir, name)}`)
	}
	for (const name of result.added) lines.push(`new ${name}`)
	for (const name of result.missing) lines.push(`missing ${name}`)
	return lines.join('\n')
}

export const writeCrops = (result, cropDir) => {
	fs.rmSync(cropDir, { recursive: true, force: true })
	for (const { name, before, after, ranges } of result.changed) {
		const file = path.join(cropDir, name)
		fs.mkdirSync(path.dirname(file), { recursive: true })
		const crop = sideBySide(before, after, ranges[0][0], ranges.at(-1)[1])
		fs.writeFileSync(file, encodePng(crop))
	}
}

const main = () => {
	const [beforeLabel = 'main', afterLabel = 'branch'] = process.argv.slice(2)
	const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
	const screenshots = path.join(projectDir, 'cypress', 'screenshots')
	const captures = path.join(screenshots, 'capture.cy.js')
	const cropDir = path.join(screenshots, 'compare', afterLabel)
	const result = compareFolders(
		path.join(captures, beforeLabel),
		path.join(captures, afterLabel),
	)
	writeCrops(result, cropDir)
	console.log(report(result, path.relative(projectDir, cropDir)))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
