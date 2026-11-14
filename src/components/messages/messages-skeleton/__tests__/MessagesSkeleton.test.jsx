import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import MessagesSkeleton from '@/components/messages/messages-skeleton/MessagesSkeleton'
import { MESSAGE_SKELETON, MESSAGES_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { MESSAGES_LAYOUT } from '@/constants/ui'

const byDataCy = (container, id) =>
	container.querySelectorAll(`[data-cy="${id}"]`)

describe('MessagesSkeleton', () => {
	it('lists card skeletons in the card list below the inbox width', () => {
		const { container } = render(<MessagesSkeleton />)
		const [list] = byDataCy(container, MESSAGES_SKELETON.ROOT)
		expect(list).toHaveAttribute('aria-busy', 'true')
		expect(list.className).toBe(MESSAGES_LAYOUT.CARD_LIST)
		expect(byDataCy(container, MESSAGE_SKELETON.ROOT)).toHaveLength(
			MESSAGES_CONFIG.SKELETON_COUNT,
		)
	})

	it('lists row skeletons in the inbox list, with the pane beside them', () => {
		const { container } = render(<MessagesSkeleton isInbox />)
		const [list] = byDataCy(container, MESSAGES_SKELETON.ROOT)
		expect(list.className).toBe(MESSAGES_LAYOUT.INBOX_LIST)
		expect(byDataCy(container, MESSAGE_SKELETON.ROW)).toHaveLength(
			MESSAGES_CONFIG.INBOX_SKELETON_COUNT,
		)
		expect(byDataCy(container, MESSAGE_SKELETON.PANE)).toHaveLength(1)
	})
})
