import { vi } from 'vitest'
import { join } from 'node:path'

import { run } from '../lifecycle.mjs'
import { PROJECT_ID, STATUS } from '../project.mjs'

const AUTHOR = 'andres-codigo'

const issueOf = (number, { state = 'open', labels = [] } = {}) => ({
	number,
	state,
	node_id: `I_${number}`,
	labels: labels.map((name) => ({ name })),
})

const makeWorld = ({
	body = 'Closes #5',
	draft = false,
	merged = false,
	login = AUTHOR,
	headRef = 'feature/thing',
	prLabels = [],
	issues = [issueOf(5)],
	listed = [],
	accessError = false,
} = {}) => {
	const pr = {
		number: 50,
		node_id: 'PR_50',
		title: 'feat: a thing',
		draft,
		merged,
		user: { login },
		head: { ref: headRef },
		body,
		labels: prLabels.map((name) => ({ name })),
	}
	const world = {
		pr,
		statuses: {},
		issues: Object.fromEntries(issues.map((i) => [i.number, i])),
	}

	const rest = {
		pulls: {
			get: vi.fn(async () => ({ data: pr })),
			update: vi.fn(async ({ body: next }) => {
				pr.body = next
			}),
		},
		issues: {
			get: vi.fn(async ({ issue_number }) => ({
				data: world.issues[issue_number],
			})),
			update: vi.fn(async ({ issue_number, state }) => {
				world.issues[issue_number].state = state
			}),
			addAssignees: vi.fn(async () => ({})),
			addLabels: vi.fn(async () => ({})),
			removeLabel: vi.fn(async () => ({})),
			create: vi.fn(async () => ({ data: { number: 99 } })),
			listForRepo: vi.fn(),
		},
	}
	world.issues[99] = issueOf(99)

	const graphql = vi.fn(async (query, variables) => {
		if (accessError)
			throw new Error('Resource not accessible by integration')
		if (query.includes('projectItems')) {
			return {
				node: {
					projectItems: {
						nodes: [
							{
								id: `ITEM_${variables.contentId}`,
								project: { id: PROJECT_ID },
							},
						],
					},
				},
			}
		}
		world.statuses[variables.itemId] = variables.optionId
		return {}
	})

	const github = {
		rest,
		graphql,
		paginate: {
			iterator: vi.fn(async function* () {
				yield { data: listed }
			}),
		},
	}
	const core = { info: vi.fn(), warning: vi.fn(), setFailed: vi.fn() }

	world.rest = rest
	world.core = core
	world.run = (action) =>
		run({
			github,
			core,
			getOctokit: vi.fn(),
			context: {
				repo: { owner: 'o', repo: 'r' },
				payload: { action, pull_request: pr },
			},
		})

	return world
}

describe('lifecycle run', () => {
	beforeEach(() => {
		vi.stubEnv('GITHUB_WORKSPACE', join(import.meta.dirname, '../../..'))
		vi.stubEnv('PROJECT_AUTOMATION_TOKEN', '')
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	describe('opening', () => {
		it('puts the linked issue In review and assigns the author', async () => {
			const world = makeWorld()

			await world.run('opened')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.IN_REVIEW })
			expect(world.rest.issues.addAssignees).toHaveBeenCalledTimes(2)
			expect(world.rest.issues.addAssignees).toHaveBeenCalledWith(
				expect.objectContaining({
					issue_number: 5,
					assignees: [AUTHOR],
				}),
			)
			expect(world.rest.issues.addAssignees).toHaveBeenCalledWith(
				expect.objectContaining({ issue_number: 50 }),
			)
		})

		it('puts the linked issue In progress for a draft', async () => {
			const world = makeWorld({ draft: true })

			await world.run('opened')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.IN_PROGRESS })
		})

		it('also assigns and moves on reopen', async () => {
			const world = makeWorld()

			await world.run('reopened')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.IN_REVIEW })
			expect(world.rest.issues.addAssignees).toHaveBeenCalled()
		})

		it('does not reassign on ready for review', async () => {
			const world = makeWorld()

			await world.run('ready_for_review')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.IN_REVIEW })
			expect(world.rest.issues.addAssignees).not.toHaveBeenCalled()
		})

		it('moves to In progress when converted to draft', async () => {
			const world = makeWorld({ draft: true })

			await world.run('converted_to_draft')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.IN_PROGRESS })
		})

		it('does nothing to the board on an edit', async () => {
			const world = makeWorld()

			await world.run('edited')

			expect(world.statuses).toEqual({})
		})

		it('leaves a blocked issue Blocked', async () => {
			const world = makeWorld({
				issues: [issueOf(5, { labels: ['blocked'] })],
			})

			await world.run('opened')

			expect(world.statuses).toEqual({})
		})

		it('moves every issue the PR closes and counts each once', async () => {
			const world = makeWorld({
				body: 'Closes #5, fixes #5 and resolves #6',
				issues: [issueOf(5), issueOf(6)],
			})

			await world.run('opened')

			expect(world.statuses).toEqual({
				ITEM_I_5: STATUS.IN_REVIEW,
				ITEM_I_6: STATUS.IN_REVIEW,
			})
		})

		it('does not assign a Dependabot author', async () => {
			const world = makeWorld({
				body: 'Bumps a dependency',
				login: 'dependabot[bot]',
			})

			await world.run('opened')

			expect(world.rest.issues.addAssignees).not.toHaveBeenCalled()
		})
	})

	describe('finding the issue', () => {
		it('prefers the Tracking-Issue marker over keyword links', async () => {
			const world = makeWorld({
				body: 'Closes #5\n\nTracking-Issue: #7',
				issues: [issueOf(5), issueOf(7)],
			})

			await world.run('opened')

			expect(world.statuses).toEqual({ ITEM_I_7: STATUS.IN_REVIEW })
		})

		it('reuses the tracking issue that already names the PR', async () => {
			const world = makeWorld({
				body: 'No link',
				issues: [issueOf(8)],
				listed: [
					{ number: 3, body: 'unrelated' },
					{ number: 8, body: 'x\n- Pull request: #50\ny' },
					{
						number: 9,
						body: '- Pull request: #50',
						pull_request: {},
					},
				],
			})

			await world.run('opened')

			expect(world.statuses).toEqual({ ITEM_I_8: STATUS.IN_REVIEW })
			expect(world.rest.pulls.update).toHaveBeenCalledWith(
				expect.objectContaining({
					body: 'No link\n\nTracking-Issue: #8',
				}),
			)
			expect(world.rest.issues.create).not.toHaveBeenCalled()
		})

		it('creates a tracking issue when nothing links the PR', async () => {
			const world = makeWorld({ body: 'No link' })

			await world.run('opened')

			expect(world.rest.issues.create).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Tracking: feat: a thing',
					body: expect.stringContaining('- Pull request: #50'),
				}),
			)
			expect(world.pr.body).toBe('No link\n\nTracking-Issue: #99')
			expect(world.statuses).toEqual({ ITEM_I_99: STATUS.IN_REVIEW })
		})

		it.each([
			['Dependabot', { login: 'dependabot[bot]' }],
			['release-please', { headRef: 'release-please--branches--main' }],
		])(
			'gives a %s PR its own card and no tracking issue',
			async (_, options) => {
				const world = makeWorld({ body: 'Bumps', ...options })

				await world.run('opened')

				expect(world.rest.issues.create).not.toHaveBeenCalled()
				expect(world.statuses).toEqual({ ITEM_PR_50: STATUS.IN_REVIEW })
			},
		)

		it('moves the PR card to Done on merge when nothing tracks it', async () => {
			const world = makeWorld({
				body: 'Bumps',
				login: 'dependabot[bot]',
				merged: true,
			})

			await world.run('closed')

			expect(world.statuses).toEqual({ ITEM_PR_50: STATUS.DONE })
		})
	})

	describe('merging', () => {
		it('marks the issue Done and closes it', async () => {
			const world = makeWorld({ merged: true })

			await world.run('closed')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.DONE })
			expect(world.rest.issues.update).toHaveBeenCalledWith(
				expect.objectContaining({ issue_number: 5, state: 'closed' }),
			)
		})

		it('leaves an already closed issue closed without updating it', async () => {
			const world = makeWorld({
				merged: true,
				issues: [issueOf(5, { state: 'closed' })],
			})

			await world.run('closed')

			expect(world.rest.issues.update).not.toHaveBeenCalled()
			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.DONE })
		})

		it('removes the in-progress label', async () => {
			const world = makeWorld({
				merged: true,
				issues: [issueOf(5, { labels: ['in-progress'] })],
			})

			await world.run('closed')

			expect(world.rest.issues.removeLabel).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'in-progress' }),
			)
		})

		it('copies the PR managed labels onto a single issue', async () => {
			const world = makeWorld({
				merged: true,
				prLabels: ['refactor', 'ci-cd', 'ready'],
				issues: [issueOf(5, { labels: ['chore'] })],
			})

			await world.run('closed')

			expect(world.rest.issues.addLabels).toHaveBeenCalledWith(
				expect.objectContaining({
					issue_number: 5,
					labels: expect.arrayContaining(['refactor']),
				}),
			)
			expect(world.rest.issues.removeLabel).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'chore' }),
			)
			const added = world.rest.issues.addLabels.mock.calls[0][0].labels
			expect(added).not.toContain('ready')
		})

		it('leaves the issue labels alone when the PR has no managed labels', async () => {
			const world = makeWorld({ merged: true, prLabels: ['ready'] })

			await world.run('closed')

			expect(world.rest.issues.addLabels).not.toHaveBeenCalled()
		})

		it('does not copy labels when the PR closes several issues', async () => {
			const world = makeWorld({
				body: 'Closes #5 and closes #6',
				merged: true,
				prLabels: ['refactor'],
				issues: [issueOf(5), issueOf(6)],
			})

			await world.run('closed')

			expect(world.rest.issues.addLabels).not.toHaveBeenCalled()
			expect(world.statuses).toEqual({
				ITEM_I_5: STATUS.DONE,
				ITEM_I_6: STATUS.DONE,
			})
		})

		it('marks a tracking issue Done', async () => {
			const world = makeWorld({ body: 'No link', merged: true })

			await world.run('closed')

			expect(world.statuses).toEqual({ ITEM_I_99: STATUS.DONE })
		})
	})

	describe('closing without merging', () => {
		it('sends the issue back to Ready', async () => {
			const world = makeWorld()

			await world.run('closed')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.READY })
			expect(world.rest.issues.update).not.toHaveBeenCalled()
		})

		it('keeps In progress for an issue flagged in-progress', async () => {
			const world = makeWorld({
				issues: [issueOf(5, { labels: ['in-progress'] })],
			})

			await world.run('closed')

			expect(world.statuses).toEqual({ ITEM_I_5: STATUS.IN_PROGRESS })
		})

		it('leaves a blocked issue Blocked', async () => {
			const world = makeWorld({
				issues: [issueOf(5, { labels: ['blocked'] })],
			})

			await world.run('closed')

			expect(world.statuses).toEqual({})
		})
	})

	describe('project access', () => {
		it('warns and skips the write when the token cannot write to the project', async () => {
			const world = makeWorld()

			await world.run('opened')

			expect(world.core.warning).not.toHaveBeenCalled()

			const denied = makeWorld({ accessError: true })
			await denied.run('opened')

			expect(denied.core.warning).toHaveBeenCalledWith(
				expect.stringContaining('PROJECT_AUTOMATION_TOKEN'),
			)
			expect(denied.statuses).toEqual({})
		})
	})
})
