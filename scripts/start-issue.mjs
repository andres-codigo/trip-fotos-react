import { execFileSync } from 'node:child_process'

const REPO = 'andres-codigo/trip-fotos-react'
const OWNER = 'andres-codigo'
const PROJECT = 2
const PROJECT_ID = 'PVT_kwHOAybMeM4BCojE'

const PREFIXES = {
	feat: 'feature',
	feature: 'feature',
	enhancement: 'enhancement',
	fix: 'fix',
	perf: 'fix',
	docs: 'docs',
	refactor: 'refactor',
	chore: 'chore',
	test: 'test',
}

const KINDS = {
	feature: 'Feature',
	enhancement: 'Feature',
	fix: 'Bug',
	docs: 'Docs',
	refactor: 'Chore',
	chore: 'Chore',
	test: 'Test',
}

export const parseTitle = (title) => {
	const match = /^(\w+)(?:\([^)]*\))?!?:\s*(.+)$/.exec(title)
	const prefix = match && PREFIXES[match[1].toLowerCase()]
	return prefix
		? { prefix, subject: match[2] }
		: { prefix: null, subject: title }
}

export const kindFor = (title) => KINDS[parseTitle(title).prefix] ?? null

export const branchName = (title) => {
	const { prefix, subject } = parseTitle(title)
	const slug = subject
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.split('-')
		.slice(0, 6)
		.join('-')
	return `${prefix ?? 'chore'}/${slug}`
}

export const doAfterNumbers = (body) => {
	const line = /^Do after:?\s*(.*)$/im.exec(body ?? '')
	// "before #N" names what this issue blocks, not what blocks it
	const [blockers] = (line?.[1] ?? '').split(/\bbefore\b/i)
	return [...blockers.matchAll(/#(\d+)/g)].map((m) => Number(m[1]))
}

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim()
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const json = (...args) => JSON.parse(gh(...args))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const flag = (name) => {
	const index = process.argv.indexOf(`--${name}`)
	return index === -1 ? undefined : process.argv[index + 1]
}

const stop = (message, code = 1) => {
	console.error(message)
	process.exit(code)
}

const statusOf = (number) =>
	json('issue', 'view', String(number), '--json', 'projectItems')
		.projectItems[0]?.status?.name

// Intake moves the item a few seconds after a label event, so wait for the expected Status
const waitForStatus = async (number, expected) => {
	for (let attempt = 0; attempt < 24; attempt++) {
		if ((await statusOf(number)) === expected) return
		await sleep(5000)
	}
	stop(
		`Status did not reach ${expected} (Issue Intake may have refused a label: check the issue comments). Fix the cause and re-run; never move Status by hand.`,
	)
}

const setField = (itemId, fields, name, option) => {
	const field = fields.find((f) => f.name === name)
	const match = field?.options.find(
		(o) => o.name.toLowerCase() === String(option).toLowerCase(),
	)
	if (!match) {
		stop(
			`${name} "${option}" not found. Options: ${field?.options.map((o) => o.name).join(', ')}`,
			2,
		)
	}
	gh(
		'project',
		'item-edit',
		'--project-id',
		PROJECT_ID,
		'--id',
		itemId,
		'--field-id',
		field.id,
		'--single-select-option-id',
		match.id,
	)
}

const main = async () => {
	const number = Number(process.argv[2])
	if (!number)
		stop(
			'Usage: node scripts/start-issue.mjs <issue> [--workstream <name>] [--kind <name>] [--label <area>]',
			2,
		)

	if (
		git('branch', '--show-current') !== 'main' ||
		git('status', '--porcelain')
	) {
		stop('Run from a clean main: switch to main and commit or stash first')
	}

	const issue = json(
		'issue',
		'view',
		String(number),
		'--json',
		'title,body,state,labels',
	)
	let status = await statusOf(number)
	if (
		['Done', 'In review', 'In progress'].includes(status) ||
		issue.state !== 'OPEN'
	) {
		stop(`#${number} is ${status ?? issue.state}: stop and report`)
	}

	const open = json(
		'api',
		`repos/${REPO}/issues/${number}/dependencies/blocked_by`,
	)
		.filter((b) => b.state === 'open')
		.map((b) => b.number)
	for (const n of doAfterNumbers(issue.body)) {
		if (
			json('issue', 'view', String(n), '--json', 'state').state === 'OPEN'
		)
			open.push(n)
	}
	if (open.length)
		stop(
			`Open blockers: ${[...new Set(open)].map((n) => `#${n}`).join(', ')}`,
		)

	const items = json(
		'project',
		'item-list',
		String(PROJECT),
		'--owner',
		OWNER,
		'--limit',
		'200',
		'--format',
		'json',
	).items
	const item = items.find((i) => i.content?.number === number)
	const fields = json(
		'project',
		'field-list',
		String(PROJECT),
		'--owner',
		OWNER,
		'--format',
		'json',
	).fields

	const workstream = flag('workstream') ?? item?.workstream
	const kind = flag('kind') ?? item?.kind ?? kindFor(issue.title)
	const isEpic = String(kind).toLowerCase() === 'epic'

	if (status === 'Triage') {
		if (!workstream || !kind) {
			const options = fields
				.find((f) => f.name === 'Workstream')
				.options.map((o) => o.name)
				.join(', ')
			stop(
				`Pick a Workstream (--workstream), one of: ${options}${kind ? '' : '; and a Kind (--kind)'}`,
				2,
			)
		}
		setField(item.id, fields, 'Kind', kind)
		setField(item.id, fields, 'Workstream', workstream)
		const label = flag('label') ?? parseTitle(issue.title).prefix
		if (!label) stop('Pass an area label with --label', 2)
		gh('issue', 'edit', String(number), '--add-label', label)
		await waitForStatus(number, 'Backlog')
		status = 'Backlog'
	}

	if (status === 'Backlog' && !isEpic) {
		const ready = items.filter(
			(i) =>
				i.status === 'Ready' &&
				i.workstream === (workstream ?? item?.workstream) &&
				i.content?.number !== number,
		)
		if (ready.length)
			stop(
				`Already Ready in this workstream: ${ready.map((i) => `#${i.content.number}`).join(', ')}. Ask which goes first.`,
				3,
			)
		gh('issue', 'edit', String(number), '--add-label', 'ready')
		await waitForStatus(number, 'Ready')
	}

	gh('issue', 'edit', String(number), '--add-label', 'in-progress')
	await waitForStatus(number, 'In progress')

	const branch = branchName(issue.title)
	git('switch', '-c', branch)
	git(
		'commit',
		'--allow-empty',
		'-m',
		`${issue.title}\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`,
	)
	git('push', '-u', 'origin', branch)
	const pr = gh(
		'pr',
		'create',
		'--draft',
		'--title',
		issue.title,
		'--body',
		`Closes #${number}\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
	)
	console.log(
		`#${number} started: Kind ${kind ?? 'unchanged'}, Workstream ${workstream ?? 'unchanged'}, branch ${branch}, ${pr}, Status ${await statusOf(number)}`,
	)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
