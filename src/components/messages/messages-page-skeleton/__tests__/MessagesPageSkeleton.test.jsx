import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import MessagesPageSkeleton from '@/components/messages/messages-page-skeleton/MessagesPageSkeleton'
import { MESSAGE_SKELETON, MESSAGES_PAGE_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'

const viewport = vi.hoisted(() => ({ width: 1280 }))

vi.mock('@/utils/useViewport', () => ({
	default: () => viewport,
}))

const byDataCy = (container, id) =>
	container.querySelectorAll(`[data-cy="${id}"]`)

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

	it('shows the inbox rows and pane from the tablet breakpoint', () => {
		viewport.width = GLOBAL.BREAKPOINT.TABLET
		const { container } = render(<MessagesPageSkeleton />)
		expect(byDataCy(container, MESSAGE_SKELETON.ROW)).toHaveLength(
			MESSAGES_CONFIG.INBOX_SKELETON_COUNT,
		)
		expect(byDataCy(container, MESSAGE_SKELETON.PANE)).toHaveLength(1)
	})

	it('shows card skeletons in the page card below it', () => {
		viewport.width = GLOBAL.BREAKPOINT.TABLET - 1
		const { container } = render(<MessagesPageSkeleton />)
		expect(byDataCy(container, MESSAGE_SKELETON.ROOT)).toHaveLength(
			MESSAGES_CONFIG.SKELETON_COUNT,
		)
		expect(byDataCy(container, MESSAGE_SKELETON.ROW)).toHaveLength(0)
	})
})
