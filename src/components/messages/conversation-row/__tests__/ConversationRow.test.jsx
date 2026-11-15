import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CONVERSATION_ROW } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import ConversationRow from '@/components/messages/conversation-row/ConversationRow'
import { formatFullTime } from '@/utils/formatMessageTime'

const NOW = new Date(2026, 10, 10, 15, 0).getTime()

const rowProps = {
	id: 'conv-1',
	to: '/messages/conv-1',
	name: 'Ana Lopes',
	status: SENDER_STATUS.TRAVELLER,
	lastMessage: 'See you in Lisbon',
	lastAt: NOW - 5 * 60 * 1000,
}

const renderRow = (props = {}) =>
	render(
		<MemoryRouter>
			<ul>
				<ConversationRow
					{...rowProps}
					{...props}
				/>
			</ul>
		</MemoryRouter>,
	)

describe('<ConversationRow />', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(NOW)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('renders a list item holding one link to the conversation', () => {
		renderRow()

		const root = screen.getByTestId(CONVERSATION_ROW.ROOT)
		expect(root.tagName).toBe('LI')
		expect(root.querySelectorAll('a')).toHaveLength(1)
		expect(screen.getByTestId(CONVERSATION_ROW.LINK)).toHaveAttribute(
			'href',
			rowProps.to,
		)
	})

	it('shows the name, preview and relative time with the full time as a title', () => {
		renderRow()

		expect(screen.getByTestId(CONVERSATION_ROW.NAME)).toHaveTextContent(
			rowProps.name,
		)
		expect(screen.getByTestId(CONVERSATION_ROW.PREVIEW).textContent).toBe(
			rowProps.lastMessage,
		)
		const time = screen.getByTestId(CONVERSATION_ROW.TIME)
		expect(time.tagName).toBe('TIME')
		expect(time).toHaveTextContent('5 min ago')
		expect(time).toHaveAttribute(
			'datetime',
			new Date(rowProps.lastAt).toISOString(),
		)
		expect(time).toHaveAttribute('title', formatFullTime(rowProps.lastAt))
	})

	it('prefixes the preview with "You: " when the last message is mine', () => {
		renderRow({ isLastMine: true })

		expect(screen.getByTestId(CONVERSATION_ROW.PREVIEW).textContent).toBe(
			`${MESSAGES_CONFIG.YOU_PREFIX}${rowProps.lastMessage}`,
		)
	})

	it('omits the time when there is none', () => {
		renderRow({ lastAt: null, status: SENDER_STATUS.LEGACY })

		expect(
			screen.queryByTestId(CONVERSATION_ROW.TIME),
		).not.toBeInTheDocument()
	})

	it('marks an unread row with a dot, bold name and hidden ", new"', () => {
		renderRow({ isUnread: true })

		const name = screen.getByTestId(CONVERSATION_ROW.NAME)
		expect(name).toHaveClass('font-bold')
		expect(name.textContent).toBe(
			`${rowProps.name}${MESSAGES_CONFIG.NEW_ROW_HIDDEN}`,
		)
		expect(screen.getByTestId(CONVERSATION_ROW.DOT)).toHaveAttribute(
			'aria-hidden',
			'true',
		)
		expect(screen.getByTestId(CONVERSATION_ROW.LINK)).toHaveAttribute(
			'data-unread',
			'true',
		)
	})

	it('shows no unread marker for a read row', () => {
		renderRow()

		expect(screen.getByTestId(CONVERSATION_ROW.NAME).textContent).toBe(
			rowProps.name,
		)
		expect(
			screen.queryByTestId(CONVERSATION_ROW.DOT),
		).not.toBeInTheDocument()
	})

	it('marks the open row as current, and only that row', () => {
		const { unmount } = renderRow({ isOpen: true })
		expect(screen.getByTestId(CONVERSATION_ROW.LINK)).toHaveAttribute(
			'aria-current',
			'true',
		)
		unmount()

		renderRow()
		expect(screen.getByTestId(CONVERSATION_ROW.LINK)).not.toHaveAttribute(
			'aria-current',
		)
	})

	it('calls onSelect with the id on click, and clicks without one', () => {
		const onSelect = vi.fn()
		const { unmount } = renderRow({ onSelect })

		fireEvent.click(screen.getByTestId(CONVERSATION_ROW.LINK))
		expect(onSelect).toHaveBeenCalledExactlyOnceWith(rowProps.id)
		unmount()

		renderRow()
		expect(() =>
			fireEvent.click(screen.getByTestId(CONVERSATION_ROW.LINK)),
		).not.toThrow()
	})
})
