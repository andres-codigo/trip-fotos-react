import fs from 'node:fs'
import path from 'node:path'

const PUBLIC = path.resolve(__dirname, '../../../public')
const read = (file) => fs.readFileSync(path.join(PUBLIC, file))
const indexHtml = fs.readFileSync(
	path.resolve(__dirname, '../../../index.html'),
	'utf8',
)
const manifest = JSON.parse(read('site.webmanifest').toString())

// Width and height from a PNG's IHDR chunk
const pngSize = (buffer) => [buffer.readUInt32BE(16), buffer.readUInt32BE(20)]

const metaContent = (property) =>
	indexHtml.match(
		new RegExp(`property="${property}"\\s+content="([^"]+)"`),
	)[1]

describe('brand assets', () => {
	it.each(manifest.icons.filter((icon) => icon.type === 'image/png'))(
		'manifest icon $src is $sizes',
		({ src, sizes }) => {
			expect(pngSize(read(src)).join('x')).toBe(sizes)
		},
	)

	it('keeps a maskable icon in the manifest', () => {
		expect(manifest.icons.map((icon) => icon.purpose)).toContain('maskable')
	})

	it('serves a 180px apple-touch-icon', () => {
		expect(pngSize(read('apple-touch-icon.png'))).toEqual([180, 180])
	})

	it('matches og-image.png to its og:image width and height', () => {
		expect(pngSize(read('og-image.png'))).toEqual([
			Number(metaContent('og:image:width')),
			Number(metaContent('og:image:height')),
		])
	})

	it('packs 16, 32 and 48px images into favicon.ico', () => {
		const ico = read('favicon.ico')
		const count = ico.readUInt16LE(4)
		const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16])

		expect(ico.readUInt16LE(2)).toBe(1)
		expect(sizes).toEqual([16, 32, 48])
	})

	it.each(['index.html', 'public/404.html'])(
		'links only icons that exist from %s',
		(file) => {
			const html = fs.readFileSync(
				path.resolve(__dirname, '../../..', file),
				'utf8',
			)
			const hrefs = [
				...html.matchAll(/rel="[^"]*icon[^"]*"\s+href="\/([^"]+)"/g),
			]

			expect(hrefs.length).toBeGreaterThan(0)
			hrefs.forEach(([, href]) =>
				expect(fs.existsSync(path.join(PUBLIC, href))).toBe(true),
			)
		},
	)
})
