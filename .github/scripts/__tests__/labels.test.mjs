import {
	areasForFiles,
	diffManagedLabels,
	globToRegExp,
	loadLabelConfig,
	planLabelSync,
	statusLabel,
	typeFor,
} from '../labels.mjs'

const config = loadLabelConfig()

describe('labels.json', () => {
	it('defines every label name once', () => {
		const names = [
			...config.type,
			...config.area,
			...config.status,
			...config.other,
		].map((label) => label.name)
		expect(new Set(names).size).toBe(names.length)
	})

	it('maps every allowed branch prefix to a type', () => {
		for (const prefix of [
			'feature',
			'fix',
			'docs',
			'refactor',
			'enhancement',
			'chore',
			'test',
		]) {
			expect(typeFor(config, { branch: `${prefix}/x` })).not.toBeNull()
		}
	})

	it('names the status labels by role', () => {
		expect(statusLabel(config, 'ready')).toBe('ready')
		expect(statusLabel(config, 'inProgress')).toBe('in-progress')
		expect(statusLabel(config, 'blocked')).toBe('blocked')
	})
})

describe('globToRegExp', () => {
	it.each([
		['src/components/**', 'src/components/ui/Button.jsx', true],
		['**/*.md', 'README.md', true],
		['**/*.md', '.github/instructions/a.md', true],
		['vite.config.*', 'vite.config.js', true],
		['vite.config.*', 'sub/vite.config.js', false],
		['**/*.{png,svg}', 'public/logo.svg', true],
		['*.d.ts', 'a.d.ts', true],
		['src/*.js', 'src/a/b.js', false],
	])('%s matches %s: %s', (glob, file, expected) => {
		expect(globToRegExp(glob).test(file)).toBe(expected)
	})
})

describe('typeFor', () => {
	it.each([
		['chore: upgrade Cypress', '', 'chore'],
		['feat(ui): add filter', '', 'feature'],
		['fix!: auth loop', '', 'fix'],
		['Tracking: docs: add merge strategy', '', 'docs'],
		['chore(deps): bump vite', 'dependabot/npm_and_yarn/vite', 'chore'],
		['Add a city search', 'enhancement/city-search', 'enhancement'],
		['Add a city search', '', null],
		['wip: something', 'main', null],
	])('%s on %s → %s', (title, branch, expected) => {
		expect(typeFor(config, { title, branch })).toBe(expected)
	})
})

describe('areasForFiles', () => {
	it('labels a component test as testing, not ui', () => {
		expect(
			areasForFiles(config, [
				'src/components/ui/image/__tests__/BaseImage.test.jsx',
			]),
		).toEqual(['testing'])
	})

	it('labels a stylesheet as styling, not ui', () => {
		expect(areasForFiles(config, ['src/styles/tailwind.css'])).toEqual([
			'styling',
		])
	})

	it('labels a workflow as build/deployment only', () => {
		expect(
			areasForFiles(config, ['.github/workflows/cypress-e2e.yml']),
		).toEqual(['build/deployment'])
	})

	it('labels Markdown under .claude and .github as documentation only', () => {
		expect(
			areasForFiles(config, [
				'.claude/agents/create-page.md',
				'.github/instructions/store.instructions.md',
			]),
		).toEqual(['documentation'])
	})

	it('covers the dev container, Claude config and Firebase rules', () => {
		expect(
			areasForFiles(config, [
				'.devcontainer/devcontainer.json',
				'.claude/settings.json',
				'firebase/database.rules.json',
			]),
		).toEqual(['firebase', 'config'])
	})

	it('keeps test constants out of constants', () => {
		expect(
			areasForFiles(config, ['src/constants/test/selectors/pages.js']),
		).toEqual(['testing'])
	})
})

describe('diffManagedLabels', () => {
	it('replaces managed labels and keeps status and other labels', () => {
		expect(
			diffManagedLabels(
				config,
				['fix', 'testing', 'blocked', 'javascript'],
				['chore', 'testing'],
			),
		).toEqual({ add: ['chore'], remove: ['fix'] })
	})
})

describe('planLabelSync', () => {
	const repo = (...names) =>
		names.map((name) => ({ name, color: '000000', description: '' }))

	it('renames retired labels whose replacement is missing, then creates the type label', () => {
		const steps = planLabelSync(config, repo('feature', 'bug'))
		expect(steps).toContainEqual({
			action: 'rename',
			from: 'feature',
			to: 'ui',
		})
		expect(steps).toContainEqual({
			action: 'rename',
			from: 'bug',
			to: 'fix',
		})
		expect(steps).toContainEqual(
			expect.objectContaining({ action: 'create', name: 'feature' }),
		)
	})

	it('merges a retired label into an existing replacement', () => {
		const steps = planLabelSync(config, repo('ui', 'frontend', 'question'))
		expect(steps).toContainEqual({
			action: 'merge',
			from: 'frontend',
			to: 'ui',
		})
		expect(steps).toContainEqual({ action: 'delete', name: 'question' })
	})

	it('never retires a defined label once its replacement exists', () => {
		const steps = planLabelSync(config, repo('feature', 'ui'))
		expect(steps.some((step) => step.from === 'feature')).toBe(false)
		expect(steps).not.toContainEqual({ action: 'delete', name: 'feature' })
	})

	it('deletes labels the file does not define', () => {
		expect(planLabelSync(config, repo('wontfix'))).toContainEqual({
			action: 'delete',
			name: 'wontfix',
		})
	})

	it('is a no-op when the repo already matches', () => {
		const labels = [
			...config.type,
			...config.area,
			...config.status,
			...config.other,
		]
		expect(planLabelSync(config, labels)).toEqual([])
	})
})
