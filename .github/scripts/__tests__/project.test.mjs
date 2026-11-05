import { vi } from 'vitest'
import {
	PROJECT_ID,
	STATUS,
	STATUS_FIELD_ID,
	createProjectClient,
	isResourceAccessError,
} from '../project.mjs'

const itemsFor = (...projects) => ({
	node: {
		projectItems: {
			nodes: projects.map(([id, project]) => ({
				id,
				project: { id: project },
			})),
		},
	},
})

describe('createProjectClient', () => {
	it('finds the item that belongs to this project', async () => {
		const graphql = vi
			.fn()
			.mockResolvedValue(
				itemsFor(['other', 'PVT_other'], ['mine', PROJECT_ID]),
			)
		const { findItemId } = createProjectClient(graphql)

		expect(await findItemId('I_1')).toBe('mine')
		expect(graphql).toHaveBeenCalledWith(expect.any(String), {
			contentId: 'I_1',
		})
	})

	it('returns null when the content is on no card of this project', async () => {
		const { findItemId } = createProjectClient(
			vi.fn().mockResolvedValue(itemsFor(['other', 'PVT_other'])),
		)
		expect(await findItemId('I_1')).toBeNull()
		expect(
			await createProjectClient(
				vi.fn().mockResolvedValue({ node: null }),
			).findItemId('I_1'),
		).toBeNull()
	})

	it('ensureItem reuses an existing card and adds one only when missing', async () => {
		const existing = vi
			.fn()
			.mockResolvedValue(itemsFor(['mine', PROJECT_ID]))
		expect(await createProjectClient(existing).ensureItem('I_1')).toBe(
			'mine',
		)
		expect(existing).toHaveBeenCalledTimes(1)

		const graphql = vi
			.fn()
			.mockResolvedValueOnce(itemsFor())
			.mockResolvedValueOnce({
				addProjectV2ItemById: { item: { id: 'new' } },
			})
		expect(await createProjectClient(graphql).ensureItem('I_2')).toBe('new')
		expect(graphql).toHaveBeenLastCalledWith(
			expect.stringContaining('addProjectV2ItemById'),
			{
				projectId: PROJECT_ID,
				contentId: 'I_2',
			},
		)
	})

	it('setStatus writes the Status field of the card', async () => {
		const graphql = vi.fn().mockResolvedValue({})
		await createProjectClient(graphql).setStatus('item', STATUS.DONE)

		expect(graphql).toHaveBeenCalledWith(expect.any(String), {
			projectId: PROJECT_ID,
			itemId: 'item',
			fieldId: STATUS_FIELD_ID,
			optionId: STATUS.DONE,
		})
	})

	it('setStatus skips a missing card but rejects a missing option', async () => {
		const graphql = vi.fn()
		const { setStatus } = createProjectClient(graphql)

		await setStatus(null, STATUS.DONE)
		expect(graphql).not.toHaveBeenCalled()
		await expect(setStatus('item', undefined)).rejects.toThrow(
			'status option ID',
		)
	})
})

describe('isResourceAccessError', () => {
	it('recognises a token that cannot write to the project', () => {
		expect(
			isResourceAccessError(
				new Error('Resource not accessible by integration'),
			),
		).toBe(true)
		expect(isResourceAccessError(new Error('boom'))).toBe(false)
		expect(isResourceAccessError(undefined)).toBe(false)
	})
})
