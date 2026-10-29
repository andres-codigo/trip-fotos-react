import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { PATHS } from '@/constants/ui'

const root = join(import.meta.dirname, '../../..')
const read = (file) => readFileSync(join(root, file), 'utf8')

const rewrites = JSON.parse(read('vercel.json')).rewrites.map(
	({ source }) =>
		new RegExp(
			`^${source.replace(/:\w+\(([^)]+)\)/g, '($1)').replace(/:\w+/g, '[^/]+')}$`,
		),
)

describe('routes and vercel.json', () => {
	it('rewrites every route in PATHS so production does not 404', () => {
		const unlisted = Object.entries(PATHS)
			.filter(([key]) => key !== 'HOME' && key !== 'NON_EXISTENT_PATH')
			.filter(([, path]) => !rewrites.some((re) => re.test(path)))
		expect(unlisted).toEqual([])
	})
})

describe('database requests and database.rules.json', () => {
	it('has a rule for every collection the store reads or writes', () => {
		const collections = Object.keys(
			JSON.parse(read('firebase/database.rules.json')).rules,
		)
		const slices = join(root, 'src/store/slices')
		const used = new Set()
		for (const file of readdirSync(slices)) {
			if (/\.test\./.test(file)) continue
			for (const [, name] of read(`src/store/slices/${file}`).matchAll(
				/databaseRequest\(\s*[`'"]\/(\w+)/g,
			)) {
				used.add(name)
			}
		}
		expect([...used].filter((name) => !collections.includes(name))).toEqual(
			[],
		)
	})
})

describe('README and package.json', () => {
	const readme = read('README.md')

	it('documents every npm script in the Scripts section', () => {
		const section = readme.split('## 🎯 Scripts')[1].split('\n## ')[0]
		const documented = new Set(
			[...section.matchAll(/^npm run ([\w:-]+)/gm)].map((m) => m[1]),
		)
		const scripts = Object.keys(JSON.parse(read('package.json')).scripts)
		expect(scripts.filter((name) => !documented.has(name))).toEqual([])
		expect(
			[...documented].filter((name) => !scripts.includes(name)),
		).toEqual([])
	})

	it('documents every .env.example variable in the Environment Variables table', () => {
		const table = readme
			.split('### Environment Variables')[1]
			.split('\n###')[0]
		const documented = [...table.matchAll(/`([A-Z_*]+)`/g)].map((m) => m[1])
		const example = [...read('.env.example').matchAll(/^([A-Z_]+)=/gm)].map(
			(m) => m[1],
		)
		const covers = (entry, name) =>
			entry.endsWith('*')
				? name.startsWith(entry.slice(0, -1))
				: entry === name
		expect(
			example.filter((name) => !documented.some((e) => covers(e, name))),
		).toEqual([])
		expect(
			documented.filter(
				(entry) => !example.some((n) => covers(entry, n)),
			),
		).toEqual([])
	})
})
