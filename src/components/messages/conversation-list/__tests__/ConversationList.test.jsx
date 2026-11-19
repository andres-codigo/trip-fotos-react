import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { CONVERSATION_ROW } from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import ConversationList from '@/components/messages/conversation-list/ConversationList'

const conversations = [
	{
		id: 'conv-1',
		to: '/messages/conv-1',
		name: 'Ana Lopes',
		status: SENDER_STATUS.TRAVELLER,
		lastMessage: 'See you in Lisbon',
		lastAt: Date.now(),
	},
	{
		id: 'conv-2',
		to: '/messages/conv-2',
		name: 'old@example.com',
		status: SENDER_STATUS.LEGACY,
		lastMessage: 'Hello',
		lastAt: null,
	},
]

const renderList = (props = {}) =>
	render(
		<MemoryRouter>
			<ConversationList
				conversations={conversations}
				label="Conversations"
				{...props}
			/>
		</MemoryRouter>,
	)

describe('<ConversationList />', () => {
	it('renders a labelled list with a row per conversation', () => {
		renderList()

		expect(
			screen.getByRole('list', { name: 'Conversations' }),
		).toBeInTheDocument()
		expect(screen.getAllByTestId(CONVERSATION_ROW.ROOT)).toHaveLength(2)
	})

	it('marks only the open conversation as current', () => {
		renderList({ openId: 'conv-2' })

		const links = screen.getAllByTestId(CONVERSATION_ROW.LINK)
		expect(links[0]).not.toHaveAttribute('aria-current')
		expect(links[1]).toHaveAttribute('aria-current', 'true')
	})

	it('passes onSelect to each row', () => {
		const onSelect = vi.fn()
		renderList({ onSelect })

		fireEvent.click(screen.getAllByTestId(CONVERSATION_ROW.LINK)[1])
		expect(onSelect).toHaveBeenCalledExactlyOnceWith('conv-2')
	})
})
