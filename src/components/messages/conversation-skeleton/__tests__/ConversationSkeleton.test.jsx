import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CONVERSATION_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import ConversationSkeleton from '@/components/messages/conversation-skeleton/ConversationSkeleton'

describe('<ConversationSkeleton />', () => {
	it('renders a busy list of the default number of hidden rows', () => {
		render(<ConversationSkeleton />)

		const list = screen.getByTestId(CONVERSATION_SKELETON.LIST)
		expect(list.tagName).toBe('UL')
		expect(list).toHaveAttribute('aria-busy', 'true')
		const rows = screen.getAllByTestId(CONVERSATION_SKELETON.ROW)
		expect(rows).toHaveLength(MESSAGES_CONFIG.LIST_SKELETON_COUNT)
		rows.forEach((row) =>
			expect(row).toHaveAttribute('aria-hidden', 'true'),
		)
	})

	it('renders the given number of rows', () => {
		render(<ConversationSkeleton count={2} />)

		expect(screen.getAllByTestId(CONVERSATION_SKELETON.ROW)).toHaveLength(2)
	})

	it('renders four bubbles for the thread, without a header', () => {
		render(<ConversationSkeleton variant="thread" />)

		const thread = screen.getByTestId(CONVERSATION_SKELETON.THREAD)
		expect(thread).toHaveAttribute('aria-busy', 'true')
		expect(thread.children).toHaveLength(4)
		expect(
			screen.queryByTestId(CONVERSATION_SKELETON.HEADER),
		).not.toBeInTheDocument()
	})

	it('renders the header on its own, hidden', () => {
		render(<ConversationSkeleton variant="header" />)

		const header = screen.getByTestId(CONVERSATION_SKELETON.HEADER)
		expect(header).toHaveAttribute('aria-hidden', 'true')
		expect(header.children).toHaveLength(2)
	})
})
