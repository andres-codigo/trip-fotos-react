import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { THREAD_NOTE } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import ThreadNote from '@/components/messages/thread-note/ThreadNote'

describe('<ThreadNote />', () => {
	it('tells the reader a former traveller cannot be replied to', () => {
		render(<ThreadNote status={SENDER_STATUS.FORMER} />)

		const root = screen.getByTestId(THREAD_NOTE.ROOT)
		expect(root).toHaveTextContent(
			`${MESSAGES_CONFIG.FORMER_NOTE_TITLE} ${MESSAGES_CONFIG.FORMER_NOTE}`,
		)
		expect(
			screen.getByText(MESSAGES_CONFIG.FORMER_NOTE_TITLE).tagName,
		).toBe('STRONG')
		expect(screen.queryByRole('link')).not.toBeInTheDocument()
	})

	it('offers a legacy sender a reply by email, quoting the message', () => {
		render(
			<ThreadNote
				status={SENDER_STATUS.LEGACY}
				email="old@example.com"
				message="Hello there"
			/>,
		)

		expect(screen.getByTestId(THREAD_NOTE.ROOT)).toHaveTextContent(
			MESSAGES_CONFIG.LEGACY_NOTE,
		)
		expect(screen.getByTestId(THREAD_NOTE.EMAIL)).toHaveTextContent(
			'old@example.com',
		)
		expect(
			screen.getByRole('link', { name: MESSAGES_CONFIG.REPLY_BY_EMAIL }),
		).toHaveAttribute(
			'href',
			'mailto:old@example.com?subject=Re%3A%20your%20message%20on%20Trip%20Fotos&body=%0A%0A%3E%20Hello%20there',
		)
	})

	it('drops the email and link when a legacy sender has no email', () => {
		render(<ThreadNote status={SENDER_STATUS.LEGACY} />)

		expect(screen.queryByTestId(THREAD_NOTE.EMAIL)).not.toBeInTheDocument()
		expect(screen.queryByRole('link')).not.toBeInTheDocument()
	})
})
