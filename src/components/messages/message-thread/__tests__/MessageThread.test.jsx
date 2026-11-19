import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	CONVERSATION_SKELETON,
	MESSAGE_BUBBLE,
	MESSAGE_THREAD,
} from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import MessageThread from '@/components/messages/message-thread/MessageThread'

const NOW = new Date(2026, 10, 10, 15, 0).getTime()
const at = (...parts) => new Date(...parts).getTime()

const messages = [
	{
		id: 'm1',
		senderId: 'other',
		message: 'Hi',
		createdAt: at(2026, 10, 9, 10, 0),
	},
	{
		id: 'm2',
		senderId: 'other',
		message: 'Are you there?',
		createdAt: at(2026, 10, 9, 10, 1),
	},
	{
		id: 'm3',
		senderId: 'me',
		message: 'Yes',
		createdAt: at(2026, 10, 9, 10, 2),
	},
	{
		id: 'm4',
		senderId: 'me',
		message: 'Morning',
		createdAt: at(2026, 10, 10, 8, 0),
	},
	{
		id: 'm5',
		senderId: 'other',
		message: 'Hello again',
		createdAt: at(2026, 10, 10, 9, 0),
	},
]

const renderThread = (props = {}) =>
	render(
		<MessageThread
			messages={messages}
			userId="me"
			otherName="Ana Lopes"
			label={MESSAGES_CONFIG.THREAD_LABEL('Ana Lopes')}
			{...props}
		/>,
	)

describe('<MessageThread />', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(NOW)
		Element.prototype.scrollIntoView = vi.fn()
	})

	afterEach(() => {
		vi.useRealTimers()
		delete Element.prototype.scrollIntoView
	})

	it('is a labelled region of bubbles', () => {
		renderThread()

		const region = screen.getByRole('region', {
			name: 'Conversation with Ana Lopes',
		})
		expect(region.tagName).toBe('SECTION')
		expect(region).toHaveAttribute('tabindex', '0')
		expect(screen.getAllByTestId(MESSAGE_BUBBLE.ROOT)).toHaveLength(5)
	})

	it('labels each day before its first message', () => {
		renderThread()

		const days = screen.getAllByTestId(MESSAGE_THREAD.DAY)
		expect(days.map((day) => day.textContent)).toEqual([
			'Yesterday',
			'Today',
		])
	})

	it('shows the time on the last bubble of each same-sender run', () => {
		renderThread()

		const bubbles = screen.getAllByTestId(MESSAGE_BUBBLE.ROOT)
		const hasTime = bubbles.map(
			(bubble) => bubble.querySelector('time') !== null,
		)
		expect(hasTime).toEqual([false, true, true, true, true])
	})

	it('aligns my messages as mine', () => {
		renderThread()

		const mine = screen
			.getAllByTestId(MESSAGE_BUBBLE.ROOT)
			.map((bubble) => bubble.hasAttribute('data-mine'))
		expect(mine).toEqual([false, false, true, true, false])
	})

	it('puts the New divider before the first unread message and scrolls it into view', () => {
		renderThread({ newFromId: 'm5' })

		const divider = screen.getByTestId(MESSAGE_THREAD.NEW_DIVIDER)
		expect(divider).toHaveTextContent(MESSAGES_CONFIG.NEW_DIVIDER)
		expect(divider.nextElementSibling).toHaveTextContent('Hello again')
		expect(divider.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
	})

	it('shows no divider without newFromId', () => {
		renderThread()

		expect(
			screen.queryByTestId(MESSAGE_THREAD.NEW_DIVIDER),
		).not.toBeInTheDocument()
		expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
	})

	// The scroll to the bottom itself is measured in MessageThread.cy, where layout is real
	it('does not scroll back to the New divider when a message is appended', () => {
		const { rerender } = renderThread({ newFromId: 'm5' })

		rerender(
			<MessageThread
				messages={[
					...messages,
					{
						id: 'm6',
						senderId: 'me',
						message: 'New one',
						createdAt: NOW,
						status: 'sending',
					},
				]}
				userId="me"
				otherName="Ana Lopes"
				newFromId="m5"
				label="Thread"
			/>,
		)

		expect(Element.prototype.scrollIntoView).toHaveBeenCalledOnce()
	})

	it('shows the hello state when there are no messages', () => {
		renderThread({ messages: [] })

		expect(screen.getByTestId(MESSAGE_THREAD.HELLO)).toHaveTextContent(
			MESSAGES_CONFIG.SAY_HELLO('Ana Lopes'),
		)
	})

	it('shows the skeleton while loading, and no hello state', () => {
		renderThread({ messages: [], isLoading: true })

		expect(
			screen.getByTestId(CONVERSATION_SKELETON.THREAD),
		).toBeInTheDocument()
		expect(screen.getByTestId(MESSAGE_THREAD.ROOT)).toHaveAttribute(
			'aria-busy',
			'true',
		)
		expect(
			screen.queryByTestId(MESSAGE_THREAD.HELLO),
		).not.toBeInTheDocument()
	})

	it('retries a failed message by id', () => {
		const onRetry = vi.fn()
		renderThread({
			messages: [{ ...messages[2], status: 'failed' }],
			onRetry,
		})

		fireEvent.click(
			screen.getByRole('button', { name: MESSAGES_CONFIG.TRY_AGAIN }),
		)
		expect(onRetry).toHaveBeenCalledExactlyOnceWith('m3')
	})
})
