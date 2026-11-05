import { vi } from 'vitest'
import { join } from 'node:path'

import { run } from '../intake.mjs'
import { PROJECT_ID, STATUS } from '../project.mjs'

const ASSIGNEE = 'andres-codigo'
const OLD = '2020-01-01T00:00:00Z'

const makeWorld = ({
	status = null,
	title = 'feat: add a thing',
	labels = [],
	assignees = [{ login: ASSIGNEE }],
	createdAt = OLD,
	pullRequest,
	blockers = [],
	openPulls = [],
	fields = { Kind: 'Feature', Workstream: 'Maintenance' },
} = {}) => {
	const world = {
		status,
		issue: {
			node_id: 'I_1',
			title,
			created_at: createdAt,
			labels: labels.map((name) => ({ name })),
			assignees,
			pull_request: pullRequest,
		},
	}

	const issues = {
		get: vi.fn(async () => ({ data: world.issue })),
		addLabels: vi.fn(async ({ labels: added }) => {
			world.issue.labels.push(...added.map((name) => ({ name })))
		}),
		removeLabel: vi.fn(async ({ name }) => {
			world.issue.labels = world.issue.labels.filter(
				(label) => label.name !== name,
			)
		}),
		addAssignees: vi.fn(async ({ assignees: added }) => {
			world.issue.assignees.push(...added.map((login) => ({ login })))
		}),
		createComment: vi.fn(async () => ({})),
	}

	const graphql = vi.fn(async (query, variables) => {
		if (query.includes('projectItems')) {
			return {
				node: {
					projectItems: {
						nodes: [{ id: 'ITEM', project: { id: PROJECT_ID } }],
					},
				},
			}
		}
		if (query.includes('updateProjectV2ItemFieldValue')) {
			world.status = variables.optionId
			return {}
		}
		if (query.includes('closedByPullRequestsReferences')) {
			return {
				repository: {
					issue: {
						closedByPullRequestsReferences: { nodes: openPulls },
					},
				},
			}
		}
		if (query.includes('optionId')) {
			return {
				node: {
					fieldValues: {
						nodes: world.status
							? [
									{
										optionId: world.status,
										field: {
											id: 'PVTSSF_lAHOAybMeM4BCojEzg0yW4g',
										},
									},
								]
							: [],
					},
				},
			}
		}
		return {
			node: {
				fieldValues: {
					nodes: Object.entries(fields).map(([name, value]) => ({
						name: value,
						field: { name },
					})),
				},
			},
		}
	})

	const request = vi.fn(async () => ({ data: blockers }))
	const core = { info: vi.fn(), setFailed: vi.fn() }
	const github = { rest: { issues }, graphql, request }

	world.issues = issues
	world.graphql = graphql
	world.core = core
	world.run = (context) =>
		run({
			github,
			core,
			getOctokit: vi.fn(),
			context: { repo: { owner: 'o', repo: 'r' }, ...context },
		})

	return world
}

const issueEvent = (action, extra = {}) => ({
	eventName: 'issues',
	payload: { action, issue: { number: 7 }, ...extra },
})

const labelEvent = (action, name, sender = { type: 'User' }) =>
	issueEvent(action, { label: { name }, sender })

describe('intake run', () => {
	beforeEach(() => {
		vi.stubEnv('GITHUB_WORKSPACE', join(import.meta.dirname, '../../..'))
		vi.stubEnv('DEFAULT_ASSIGNEE', ASSIGNEE)
		vi.stubEnv('PROJECT_AUTOMATION_TOKEN', '')
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	describe('opened, reopened and edited', () => {
		it('puts a new card in Triage, adds the type label and assigns', async () => {
			const world = makeWorld({ assignees: [] })
			world.issue.labels = []

			await world.run(issueEvent('opened'))

			expect(world.status).toBe(STATUS.TRIAGE)
			expect(world.issues.addLabels).toHaveBeenCalledWith(
				expect.objectContaining({ labels: ['feature'] }),
			)
			expect(world.issues.addAssignees).toHaveBeenCalled()
			expect(world.core.setFailed).not.toHaveBeenCalled()
		})

		it('keeps a single type label when the title changes', async () => {
			const world = makeWorld({
				status: STATUS.BACKLOG,
				title: 'fix: a bug',
				labels: ['feature'],
			})

			await world.run(issueEvent('edited'))

			expect(world.issues.removeLabel).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'feature' }),
			)
			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it('moves a reopened Done issue back to Backlog', async () => {
			const world = makeWorld({
				status: STATUS.DONE,
				labels: ['feature'],
			})

			await world.run(issueEvent('reopened'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it.each([
			STATUS.TRIAGE,
			STATUS.READY,
			STATUS.IN_PROGRESS,
			STATUS.IN_REVIEW,
		])(
			'never moves a card already on the board on edit (%s)',
			async (status) => {
				const world = makeWorld({ status, labels: ['feature'] })

				await world.run(issueEvent('edited'))

				expect(world.status).toBe(status)
			},
		)

		it('fails verification when the default assignee is missing', async () => {
			const world = makeWorld({
				status: STATUS.BACKLOG,
				labels: ['feature'],
			})
			world.issues.addAssignees.mockImplementation(async () => {})
			world.issue.assignees = []

			await world.run(issueEvent('edited'))

			expect(world.core.setFailed).toHaveBeenCalledWith(
				expect.stringContaining('is not assigned'),
			)
		})
	})

	describe('skipped events', () => {
		it('skips a label event from a bot', async () => {
			const world = makeWorld({ status: STATUS.TRIAGE })

			await world.run(
				labelEvent('labeled', 'ready', { type: 'Bot', login: 'x' }),
			)

			expect(world.status).toBe(STATUS.TRIAGE)
			expect(world.issues.removeLabel).not.toHaveBeenCalled()
		})

		it('skips a pull request', async () => {
			const world = makeWorld({ pullRequest: {} })

			await world.run(issueEvent('opened'))

			expect(world.status).toBeNull()
			expect(world.issues.addLabels).not.toHaveBeenCalled()
		})

		it('fails when no issue number can be resolved', async () => {
			const world = makeWorld()

			await world.run({
				eventName: 'issues',
				payload: { action: 'opened' },
			})

			expect(world.core.setFailed).toHaveBeenCalledWith(
				'Unable to resolve issue number from event payload.',
			)
		})

		it('reads the number from workflow_dispatch inputs', async () => {
			const world = makeWorld({ labels: ['feature'] })

			await world.run({
				eventName: 'workflow_dispatch',
				payload: { inputs: { issue_number: '12' } },
			})

			expect(world.issues.get).toHaveBeenCalledWith(
				expect.objectContaining({ issue_number: 12 }),
			)
			expect(world.status).toBe(STATUS.TRIAGE)
		})

		it('fails on a non-numeric workflow_dispatch input', async () => {
			const world = makeWorld()

			await world.run({
				eventName: 'workflow_dispatch',
				payload: { inputs: { issue_number: 'abc' } },
			})

			expect(world.core.setFailed).toHaveBeenCalled()
		})
	})

	describe('ready label', () => {
		it('is rejected from Triage', async () => {
			const world = makeWorld({
				status: STATUS.TRIAGE,
				labels: ['ready'],
			})

			await world.run(labelEvent('labeled', 'ready'))

			expect(world.issues.removeLabel).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'ready' }),
			)
			expect(world.issues.createComment).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining('still in Triage'),
				}),
			)
			expect(world.status).toBe(STATUS.TRIAGE)
		})

		it('moves Backlog to Ready when nothing blocks it', async () => {
			const world = makeWorld({
				status: STATUS.BACKLOG,
				labels: ['ready'],
			})

			await world.run(labelEvent('labeled', 'ready'))

			expect(world.status).toBe(STATUS.READY)
		})

		it('is rejected naming the open blockers', async () => {
			const world = makeWorld({
				status: STATUS.BACKLOG,
				labels: ['ready'],
				blockers: [
					{ number: 4, state: 'open' },
					{ number: 5, state: 'closed' },
				],
			})

			await world.run(labelEvent('labeled', 'ready'))

			expect(world.issues.createComment).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining('open #4.'),
				}),
			)
			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it('treats a card with no status as Triage and rejects ready', async () => {
			const world = makeWorld({ labels: ['ready'] })

			await world.run(labelEvent('labeled', 'ready'))

			expect(world.status).toBe(STATUS.TRIAGE)
			expect(world.issues.removeLabel).toHaveBeenCalled()
		})

		it.each([
			STATUS.READY,
			STATUS.IN_PROGRESS,
			STATUS.IN_REVIEW,
			STATUS.DONE,
		])('leaves a card in %s alone', async (status) => {
			const world = makeWorld({ status, labels: ['ready'] })

			await world.run(labelEvent('labeled', 'ready'))

			expect(world.status).toBe(status)
			expect(world.issues.removeLabel).not.toHaveBeenCalled()
		})

		it('is ignored while the issue is blocked', async () => {
			const world = makeWorld({
				status: STATUS.BACKLOG,
				labels: ['ready', 'blocked'],
			})

			await world.run(labelEvent('labeled', 'ready'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it('moves Ready back to Backlog when removed', async () => {
			const world = makeWorld({ status: STATUS.READY })

			await world.run(labelEvent('unlabeled', 'ready'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})
	})

	describe('in-progress label', () => {
		it('is rejected from Triage', async () => {
			const world = makeWorld({
				status: STATUS.TRIAGE,
				labels: ['in-progress'],
			})

			await world.run(labelEvent('labeled', 'in-progress'))

			expect(world.issues.removeLabel).toHaveBeenCalled()
			expect(world.status).toBe(STATUS.TRIAGE)
		})

		it('is rejected from Backlog for a non-epic', async () => {
			const world = makeWorld({
				status: STATUS.BACKLOG,
				labels: ['in-progress'],
			})

			await world.run(labelEvent('labeled', 'in-progress'))

			expect(world.issues.createComment).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining('Add `ready` first'),
				}),
			)
			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it('starts an epic straight from Backlog', async () => {
			const world = makeWorld({
				status: STATUS.BACKLOG,
				title: 'Epic: big thing',
				labels: ['in-progress'],
			})

			await world.run(labelEvent('labeled', 'in-progress'))

			expect(world.status).toBe(STATUS.IN_PROGRESS)
		})

		it('starts work from Ready', async () => {
			const world = makeWorld({
				status: STATUS.READY,
				labels: ['in-progress'],
			})

			await world.run(labelEvent('labeled', 'in-progress'))

			expect(world.status).toBe(STATUS.IN_PROGRESS)
		})

		it.each([STATUS.IN_REVIEW, STATUS.DONE])(
			'never pulls a card back from %s',
			async (status) => {
				const world = makeWorld({ status, labels: ['in-progress'] })

				await world.run(labelEvent('labeled', 'in-progress'))

				expect(world.status).toBe(status)
				expect(world.issues.removeLabel).not.toHaveBeenCalled()
			},
		)

		it('resolves the status when removed from In progress', async () => {
			const world = makeWorld({ status: STATUS.IN_PROGRESS })

			await world.run(labelEvent('unlabeled', 'in-progress'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})
	})

	describe('blocked label', () => {
		it.each([STATUS.BACKLOG, STATUS.READY, STATUS.IN_PROGRESS])(
			'moves %s to Blocked',
			async (status) => {
				const world = makeWorld({ status, labels: ['blocked'] })

				await world.run(labelEvent('labeled', 'blocked'))

				expect(world.status).toBe(STATUS.BLOCKED)
			},
		)

		it('returns to In review when an open non-draft PR exists', async () => {
			const world = makeWorld({
				status: STATUS.BLOCKED,
				openPulls: [{ isDraft: false, state: 'OPEN' }],
			})

			await world.run(labelEvent('unlabeled', 'blocked'))

			expect(world.status).toBe(STATUS.IN_REVIEW)
		})

		it('returns to In progress with only a draft PR', async () => {
			const world = makeWorld({
				status: STATUS.BLOCKED,
				openPulls: [{ isDraft: true, state: 'OPEN' }],
			})

			await world.run(labelEvent('unlabeled', 'blocked'))

			expect(world.status).toBe(STATUS.IN_PROGRESS)
		})

		it('ignores closed PRs', async () => {
			const world = makeWorld({
				status: STATUS.BLOCKED,
				openPulls: [{ isDraft: false, state: 'CLOSED' }],
			})

			await world.run(labelEvent('unlabeled', 'blocked'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it('returns to In progress when the label is on the issue', async () => {
			const world = makeWorld({
				status: STATUS.BLOCKED,
				labels: ['in-progress', 'ready'],
			})

			await world.run(labelEvent('unlabeled', 'blocked'))

			expect(world.status).toBe(STATUS.IN_PROGRESS)
		})

		it('returns to Ready when only ready is set', async () => {
			const world = makeWorld({
				status: STATUS.BLOCKED,
				labels: ['ready'],
			})

			await world.run(labelEvent('unlabeled', 'blocked'))

			expect(world.status).toBe(STATUS.READY)
		})

		it('returns to Backlog otherwise', async () => {
			const world = makeWorld({ status: STATUS.BLOCKED })

			await world.run(labelEvent('unlabeled', 'blocked'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})
	})

	describe('any other label', () => {
		it('moves an assessed Triage issue to Backlog', async () => {
			const world = makeWorld({ status: STATUS.TRIAGE, labels: ['docs'] })

			await world.run(labelEvent('labeled', 'docs'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it('treats a label on a card with no status as Triage first', async () => {
			const world = makeWorld({ labels: ['docs'] })

			await world.run(labelEvent('labeled', 'docs'))

			expect(world.status).toBe(STATUS.BACKLOG)
		})

		it('stays in Triage and names the missing board fields', async () => {
			const world = makeWorld({
				status: STATUS.TRIAGE,
				labels: ['docs'],
				fields: { Kind: null, Workstream: null },
			})

			await world.run(labelEvent('labeled', 'docs'))

			expect(world.issues.createComment).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining('set Kind and Workstream'),
				}),
			)
			expect(world.status).toBe(STATUS.TRIAGE)
		})

		it('names only the field that is missing', async () => {
			const world = makeWorld({
				status: STATUS.TRIAGE,
				fields: { Kind: 'Docs', Workstream: null },
			})

			await world.run(labelEvent('labeled', 'docs'))

			expect(world.issues.createComment).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining('set Workstream on'),
				}),
			)
		})

		it('ignores labels applied in the first minute of the issue', async () => {
			const world = makeWorld({
				status: STATUS.TRIAGE,
				createdAt: new Date().toISOString(),
			})

			await world.run(labelEvent('labeled', 'docs'))

			expect(world.status).toBe(STATUS.TRIAGE)
			expect(world.issues.createComment).not.toHaveBeenCalled()
		})

		it.each([
			STATUS.BACKLOG,
			STATUS.READY,
			STATUS.IN_PROGRESS,
			STATUS.DONE,
		])('does not move a card in %s', async (status) => {
			const world = makeWorld({ status })

			await world.run(labelEvent('labeled', 'docs'))

			expect(world.status).toBe(status)
		})

		it('leaves the status alone when an unrelated label is removed', async () => {
			const world = makeWorld({ status: STATUS.READY })

			await world.run(labelEvent('unlabeled', 'docs'))

			expect(world.status).toBe(STATUS.READY)
		})
	})

	describe('project failures', () => {
		it('reports a failed status update with the token hint', async () => {
			const world = makeWorld({ labels: ['docs'] })
			world.graphql.mockRejectedValue(new Error('boom'))

			await world.run(labelEvent('labeled', 'docs'))

			expect(world.core.setFailed).toHaveBeenCalledWith(
				expect.stringContaining('PROJECT_AUTOMATION_TOKEN'),
			)
		})

		it('fails verification when the card has no status afterwards', async () => {
			const world = makeWorld({ labels: ['docs'] })
			world.issues.get.mockResolvedValue({ data: world.issue })
			world.graphql.mockImplementation(async (query) => {
				if (query.includes('projectItems')) {
					return {
						node: {
							projectItems: {
								nodes: [
									{ id: 'ITEM', project: { id: PROJECT_ID } },
								],
							},
						},
					}
				}
				return { node: { fieldValues: { nodes: [] } } }
			})

			await world.run(issueEvent('edited'))

			expect(world.core.setFailed).toHaveBeenCalledWith(
				expect.stringContaining('has no project status'),
			)
		})
	})
})
