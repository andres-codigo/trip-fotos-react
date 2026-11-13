import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { MESSAGE_ACTIONS, MESSAGE_PANE, MOCK_INBOX } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import MessagePane from '@/components/messages/message-pane/MessagePane'
import { formatFullTime } from '@/utils/formatMessageTime'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const CARD_STUB = 'card-stub'
const DELETE_ERROR = 'This message could not be deleted.'
const LONG_MESSAGE = 'a'.repeat(MESSAGES_CONFIG.CLAMP_LENGTH + 1)

const travellerProps = {
	id: SAMPLE_MESSAGE_ONE.id,
	senderId: SAMPLE_MESSAGE_ONE.senderId,
	senderName: SAMPLE_MESSAGE_ONE.senderName,
	senderStatus: SAMPLE_MESSAGE_ONE.senderStatus,
	message: SAMPLE_MESSAGE_ONE.message,
	createdAt: SAMPLE_MESSAGE_ONE.createdAt,
}

const legacyProps = {
	id: SAMPLE_MESSAGE_TWO.id,
	senderId: SAMPLE_MESSAGE_TWO.senderId,
	senderName: SAMPLE_MESSAGE_TWO.senderName,
	createdAt: SAMPLE_MESSAGE_TWO.createdAt,
	senderStatus: SAMPLE_MESSAGE_TWO.senderStatus,
	userEmail: SAMPLE_MESSAGE_TWO.userEmail,
	message: SAMPLE_MESSAGE_TWO.message,
}

const renderPane = (props = {}) => {
	const onDelete = vi.fn()
	const onRetry = vi.fn()

	render(
		<MemoryRouter initialEntries={['/messages']}>
			<Routes>
				<Route
					path="/messages"
					element={
						<MessagePane
							{...travellerProps}
							onDelete={onDelete}
							onRetry={onRetry}
							{...props}
						/>
					}
				/>
				<Route
					path="/travellers/:id"
					element={<p data-cy={CARD_STUB}>Card</p>}
				/>
			</Routes>
		</MemoryRouter>,
	)

	return { onDelete, onRetry }
}

describe('<MessagePane />', () => {
	describe('Rendering', () => {
		it('renders an article labelled by the sender heading', () => {
			renderPane()

			const root = screen.getByTestId(MESSAGE_PANE.ROOT)
			expect(root.tagName).toBe('ARTICLE')
			expect(root).toHaveAttribute(
				'data-message-id',
				SAMPLE_MESSAGE_ONE.id,
			)
			expect(
				screen.getByRole('article', {
					name: SAMPLE_MESSAGE_ONE.senderName,
				}),
			).toBe(root)
		})

		it('shows the whole of a long message, with no Show all', () => {
			renderPane({ message: LONG_MESSAGE })

			const text = screen.getByTestId(MESSAGE_PANE.TEXT)
			expect(text).toHaveTextContent(LONG_MESSAGE)
			expect(text).not.toHaveClass('line-clamp-5')
			expect(
				screen.queryByRole('button', {
					name: MESSAGES_CONFIG.SHOW_ALL,
				}),
			).not.toBeInTheDocument()
		})
	})

	describe('Heading', () => {
		it('is a focusable h2 that the headingRef points at', () => {
			const headingRef = createRef()
			renderPane({ headingRef })

			const heading = screen.getByRole('heading', { level: 2 })
			expect(heading).toBe(screen.getByTestId(MESSAGE_PANE.SENDER))
			expect(heading).toHaveAttribute('tabindex', '-1')
			expect(headingRef.current).toBe(heading)

			headingRef.current.focus()
			expect(heading).toHaveFocus()
		})
	})

	describe('Sender', () => {
		it('links a traveller sender to their card and offers Reply', () => {
			renderPane()

			const link = screen.getByTestId(MESSAGE_PANE.SENDER_LINK)
			expect(link).toHaveTextContent(SAMPLE_MESSAGE_ONE.senderName)
			expect(link).toHaveAttribute(
				'href',
				`/travellers/${SAMPLE_MESSAGE_ONE.senderId}`,
			)
			expect(screen.getByTestId(MESSAGE_ACTIONS.REPLY)).toHaveTextContent(
				MESSAGES_CONFIG.REPLY,
			)

			fireEvent.click(link)

			expect(screen.getByTestId(CARD_STUB)).toBeInTheDocument()
		})

		it('names an unknown sender with Reply and no card link', () => {
			renderPane({
				senderName: null,
				senderStatus: SENDER_STATUS.UNKNOWN,
			})

			expect(screen.getByTestId(MESSAGE_PANE.SENDER)).toHaveTextContent(
				MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
			)
			expect(
				screen.queryByTestId(MESSAGE_PANE.SENDER_LINK),
			).not.toBeInTheDocument()
			expect(
				screen.getByTestId(MESSAGE_ACTIONS.REPLY),
			).toBeInTheDocument()
		})

		it('offers a former traveller Delete only', () => {
			renderPane({ senderName: null, senderStatus: SENDER_STATUS.FORMER })

			expect(screen.getByTestId(MESSAGE_PANE.SENDER)).toHaveTextContent(
				MESSAGES_CONFIG.FORMER_TRAVELLER,
			)
			expect(
				screen.queryByTestId(MESSAGE_PANE.SENDER_LINK),
			).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(MESSAGE_ACTIONS.REPLY),
			).not.toBeInTheDocument()
			expect(
				screen.getByRole('button', {
					name: MESSAGES_CONFIG.DELETE_LABEL(
						MESSAGES_CONFIG.FORMER_TRAVELLER,
					),
				}),
			).toBeInTheDocument()
		})

		it('offers a legacy sender Reply by email, with no time', () => {
			renderPane(legacyProps)

			expect(screen.getByTestId(MESSAGE_PANE.SENDER)).toHaveTextContent(
				SAMPLE_MESSAGE_TWO.userEmail,
			)
			expect(screen.getByTestId(MESSAGE_ACTIONS.REPLY)).toHaveTextContent(
				MESSAGES_CONFIG.REPLY_BY_EMAIL,
			)
			expect(
				screen.queryByTestId(MESSAGE_PANE.TIME),
			).not.toBeInTheDocument()
		})
	})

	describe('New', () => {
		it('shows the New tag with " message" for screen readers', () => {
			renderPane({ isNew: true })

			expect(screen.getByTestId(MESSAGE_PANE.NEW_TAG)).toHaveTextContent(
				`${MESSAGES_CONFIG.NEW_TAG}${MESSAGES_CONFIG.NEW_TAG_HIDDEN}`,
			)
		})

		it('shows no tag for a read message', () => {
			renderPane()

			expect(
				screen.queryByTestId(MESSAGE_PANE.NEW_TAG),
			).not.toBeInTheDocument()
		})
	})

	describe('Time', () => {
		it('shows the full time with a machine-readable datetime', () => {
			renderPane()

			const time = screen.getByTestId(MESSAGE_PANE.TIME)
			expect(time.tagName).toBe('TIME')
			expect(time).toHaveTextContent(
				formatFullTime(SAMPLE_MESSAGE_ONE.createdAt),
			)
			expect(time).toHaveAttribute(
				'datetime',
				new Date(SAMPLE_MESSAGE_ONE.createdAt).toISOString(),
			)
		})
	})

	describe('Actions', () => {
		it('adds no outer spacing to the actions row', () => {
			renderPane()

			expect(screen.getByTestId(MESSAGE_ACTIONS.ROOT)).not.toHaveClass(
				'mt-3',
			)
		})

		it('calls onDelete with the id', () => {
			const { onDelete } = renderPane()

			fireEvent.click(screen.getByTestId(MESSAGE_ACTIONS.DELETE))

			expect(onDelete).toHaveBeenCalledExactlyOnceWith(
				SAMPLE_MESSAGE_ONE.id,
			)
		})

		it('shows the delete error with Try again, reading Trying again while retrying', () => {
			renderPane({ deleteError: DELETE_ERROR, isRetrying: true })

			expect(screen.getByTestId(MESSAGE_PANE.ROOT)).toContainElement(
				screen.getByRole('alert'),
			)
			const retry = screen.getByTestId(MESSAGE_ACTIONS.TRY_AGAIN)
			expect(retry).toHaveTextContent(MESSAGES_CONFIG.TRYING_AGAIN)
			expect(retry).toBeDisabled()
		})
	})
})
