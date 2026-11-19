import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MESSAGE_BUBBLE } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import MessageBubble from '@/components/messages/message-bubble/MessageBubble'
import { formatFullTime } from '@/utils/formatMessageTime'

const CREATED_AT = new Date(2026, 10, 10, 9, 5).getTime()

const renderBubble = (props = {}) =>
	render(
		<MessageBubble
			message={'Hello\nfrom Lisbon'}
			isMine={false}
			senderName="Ana Lopes"
			createdAt={CREATED_AT}
			{...props}
		/>,
	)

describe('<MessageBubble />', () => {
	it('starts the bubble with the sender and time for screen readers', () => {
		renderBubble()

		const text = screen.getByTestId(MESSAGE_BUBBLE.TEXT)
		expect(text.tagName).toBe('P')
		expect(text.textContent).toBe('Ana Lopes, 09:05: Hello\nfrom Lisbon')
		expect(screen.getByText('Ana Lopes, 09:05:')).toHaveClass('sr-only')
	})

	it('says "You" for my own message', () => {
		renderBubble({ isMine: true })

		expect(screen.getByTestId(MESSAGE_BUBBLE.TEXT).textContent).toMatch(
			/^You, 09:05: /,
		)
		expect(screen.getByTestId(MESSAGE_BUBBLE.ROOT)).toHaveAttribute(
			'data-mine',
			'true',
		)
	})

	it('shows the time only when asked', () => {
		const { unmount } = renderBubble()
		expect(
			screen.queryByTestId(MESSAGE_BUBBLE.TIME),
		).not.toBeInTheDocument()
		unmount()

		renderBubble({ showTime: true })
		const time = screen.getByTestId(MESSAGE_BUBBLE.TIME)
		expect(time).toHaveTextContent('09:05')
		expect(time).toHaveAttribute('title', formatFullTime(CREATED_AT))
	})

	it('shows "Sending…" instead of the time while sending', () => {
		renderBubble({ isMine: true, status: 'sending', showTime: true })

		expect(screen.getByTestId(MESSAGE_BUBBLE.SENDING)).toHaveTextContent(
			MESSAGES_CONFIG.SENDING,
		)
		expect(
			screen.queryByTestId(MESSAGE_BUBBLE.TIME),
		).not.toBeInTheDocument()
	})

	it('announces a failed send and retries from the button', () => {
		const onRetry = vi.fn()
		renderBubble({
			isMine: true,
			status: 'failed',
			showTime: true,
			onRetry,
		})

		const alert = screen.getByRole('alert')
		expect(alert).toHaveTextContent(
			`${MESSAGES_CONFIG.NOT_SENT}${MESSAGES_CONFIG.TRY_AGAIN}`,
		)
		expect(
			screen.queryByTestId(MESSAGE_BUBBLE.TIME),
		).not.toBeInTheDocument()

		fireEvent.click(
			screen.getByRole('button', { name: MESSAGES_CONFIG.TRY_AGAIN }),
		)
		expect(onRetry).toHaveBeenCalledOnce()
	})
})
