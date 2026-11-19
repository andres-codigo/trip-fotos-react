import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import MessagesPageSkeleton from '@/components/messages/messages-page-skeleton/MessagesPageSkeleton'
import { CONVERSATION_SKELETON, MESSAGES_PAGE_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'
import { getByDataCy } from '@/testUtils/cypress/selectors'

const viewport = vi.hoisted(() => ({ width: 1280 }))

vi.mock('@/utils/useViewport', () => ({
	default: () => viewport,
}))

const byDataCy = (container, id) => container.querySelectorAll(getByDataCy(id))

describe('MessagesPageSkeleton', () => {
	beforeEach(() => {
		viewport.width = 1280
	})

	it('is the page landmark with the heading and a loading status', () => {
		const { container } = render(<MessagesPageSkeleton />)
		expect(
			byDataCy(container, MESSAGES_PAGE_SKELETON.ROOT)[0].tagName,
		).toBe('MAIN')
		expect(
			screen.getByRole('heading', {
				level: 1,
				name: MESSAGES_CONFIG.TITLE,
			}),
		).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent(
			GLOBAL.SPINNER_LABEL.MESSAGES,
		)
	})

	it('shows the list rows beside a thread from the tablet breakpoint', () => {
		viewport.width = GLOBAL.BREAKPOINT.TABLET
		const { container } = render(<MessagesPageSkeleton />)
		expect(byDataCy(container, CONVERSATION_SKELETON.ROW)).toHaveLength(
			MESSAGES_CONFIG.DESKTOP_LIST_SKELETON_COUNT,
		)
		expect(byDataCy(container, CONVERSATION_SKELETON.THREAD)).toHaveLength(
			1,
		)
	})

	it('shows the list alone below it', () => {
		viewport.width = GLOBAL.BREAKPOINT.TABLET - 1
		const { container } = render(<MessagesPageSkeleton />)
		expect(byDataCy(container, CONVERSATION_SKELETON.ROW)).toHaveLength(
			MESSAGES_CONFIG.LIST_SKELETON_COUNT,
		)
		expect(byDataCy(container, CONVERSATION_SKELETON.THREAD)).toHaveLength(
			0,
		)
	})
})
