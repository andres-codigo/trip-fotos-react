import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MESSAGE_ITEM, MOCK_INBOX } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import MessageItem from '@/components/messages/message-item/MessageItem'
import { formatFullTime } from '@/utils/formatMessageTime'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const CONTACT_STUB = 'contact-stub'
const CARD_STUB = 'card-stub'
const DELETE_ERROR = 'This message could not be deleted.'
const LONG_MESSAGE = 'a'.repeat(MESSAGES_CONFIG.CLAMP_LENGTH + 1)

const ContactStub = () => {
	const location = useLocation()
	return (
		<p data-cy={CONTACT_STUB}>{JSON.stringify(location.state ?? null)}</p>
	)
}

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

const renderItem = (props = {}) => {
	const onDelete = vi.fn()
	const onRetry = vi.fn()

	render(
		<MemoryRouter initialEntries={['/messages']}>
			<Routes>
				<Route
					path="/messages"
					element={
						<ul>
							<MessageItem
								{...travellerProps}
								onDelete={onDelete}
								onRetry={onRetry}
								{...props}
							/>
						</ul>
					}
				/>
				<Route
					path="/travellers/:id/contact"
					element={<ContactStub />}
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

describe('<MessageItem />', () => {
	describe('Sender', () => {
		it('links a traveller sender to their card and offers Reply', () => {
			renderItem()

			const link = screen.getByTestId(MESSAGE_ITEM.SENDER_LINK)
			expect(link).toHaveTextContent(SAMPLE_MESSAGE_ONE.senderName)
			expect(link).toHaveAttribute(
				'href',
				`/travellers/${SAMPLE_MESSAGE_ONE.senderId}`,
			)
			expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
				SAMPLE_MESSAGE_ONE.senderName,
			)
			expect(screen.getByTestId(MESSAGE_ITEM.REPLY)).toHaveAttribute(
				'href',
				`/travellers/${SAMPLE_MESSAGE_ONE.senderId}/contact`,
			)
			expect(screen.getByTestId(MESSAGE_ITEM.REPLY)).toHaveTextContent(
				MESSAGES_CONFIG.REPLY,
			)
		})

		it('opens the traveller card from the sender link', () => {
			renderItem()

			fireEvent.click(screen.getByTestId(MESSAGE_ITEM.SENDER_LINK))

			expect(screen.getByTestId(CARD_STUB)).toBeInTheDocument()
		})

		it('names an unknown sender "A traveller", with Reply but no card link', () => {
			renderItem({
				senderName: null,
				senderStatus: SENDER_STATUS.UNKNOWN,
			})

			expect(screen.getByTestId(MESSAGE_ITEM.SENDER)).toHaveTextContent(
				MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
			)
			expect(
				screen.queryByTestId(MESSAGE_ITEM.SENDER_LINK),
			).not.toBeInTheDocument()
			expect(screen.getByTestId(MESSAGE_ITEM.REPLY)).toHaveAttribute(
				'href',
				`/travellers/${SAMPLE_MESSAGE_ONE.senderId}/contact`,
			)
		})

		it('names a former traveller with no card link and no Reply', () => {
			renderItem({
				senderName: null,
				senderStatus: SENDER_STATUS.FORMER,
			})

			expect(screen.getByTestId(MESSAGE_ITEM.SENDER)).toHaveTextContent(
				MESSAGES_CONFIG.FORMER_TRAVELLER,
			)
			expect(
				screen.queryByTestId(MESSAGE_ITEM.SENDER_LINK),
			).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(MESSAGE_ITEM.REPLY),
			).not.toBeInTheDocument()
		})

		it('shows a legacy sender email with a Reply by email mailto link', () => {
			renderItem(legacyProps)

			expect(screen.getByTestId(MESSAGE_ITEM.SENDER)).toHaveTextContent(
				SAMPLE_MESSAGE_TWO.userEmail,
			)
			expect(
				screen.queryByTestId(MESSAGE_ITEM.SENDER_LINK),
			).not.toBeInTheDocument()

			const reply = screen.getByTestId(MESSAGE_ITEM.REPLY)
			expect(reply).toHaveTextContent(MESSAGES_CONFIG.REPLY_BY_EMAIL)

			const href = reply.getAttribute('href')
			expect(href).toMatch(`mailto:${SAMPLE_MESSAGE_TWO.userEmail}?`)
			expect(href).not.toContain('+')
			const params = new URLSearchParams(href.split('?')[1])
			expect(params.get('subject')).toBe(
				MESSAGES_CONFIG.REPLY_EMAIL_SUBJECT,
			)
			expect(params.get('body')).toBe(
				`\n\n> ${SAMPLE_MESSAGE_TWO.message}`,
			)
		})

		it('shows no Reply for a legacy message without an email', () => {
			renderItem({ ...legacyProps, userEmail: null })

			expect(
				screen.queryByTestId(MESSAGE_ITEM.REPLY),
			).not.toBeInTheDocument()
		})
	})

	describe('New marker', () => {
		it('shows the dot and the New tag, with " message" for screen readers', () => {
			renderItem({ isNew: true })

			const root = screen.getByTestId(MESSAGE_ITEM.ROOT)
			expect(root).toHaveAttribute('data-new', 'true')
			expect(root.className).toMatch('bg-surface-accent')
			expect(
				root.querySelector('span[aria-hidden="true"].rounded-full'),
			).toBeInTheDocument()

			const tag = screen.getByTestId(MESSAGE_ITEM.NEW_TAG)
			expect(tag).toHaveTextContent(
				`${MESSAGES_CONFIG.NEW_TAG}${MESSAGES_CONFIG.NEW_TAG_HIDDEN}`,
			)
			expect(
				screen.getByText(MESSAGES_CONFIG.NEW_TAG_HIDDEN.trim()),
			).toHaveClass('sr-only')
		})

		it('shows no marker for a read message', () => {
			renderItem()

			const root = screen.getByTestId(MESSAGE_ITEM.ROOT)
			expect(root).not.toHaveAttribute('data-new')
			expect(root.className).not.toMatch('bg-surface-accent')
			expect(
				root.querySelector('span[aria-hidden="true"].rounded-full'),
			).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(MESSAGE_ITEM.NEW_TAG),
			).not.toBeInTheDocument()
		})
	})

	describe('Time', () => {
		beforeEach(() => {
			vi.useFakeTimers({ toFake: ['Date'] })
			vi.setSystemTime(SAMPLE_MESSAGE_ONE.createdAt + 5 * 60 * 1000)
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('shows the relative time with a machine-readable datetime and the full time as a title', () => {
			renderItem()

			const time = screen.getByTestId(MESSAGE_ITEM.TIME)
			expect(time.tagName).toBe('TIME')
			expect(time).toHaveTextContent('5 min ago')
			expect(time).toHaveAttribute(
				'datetime',
				new Date(SAMPLE_MESSAGE_ONE.createdAt).toISOString(),
			)
			expect(time).toHaveAttribute(
				'title',
				formatFullTime(SAMPLE_MESSAGE_ONE.createdAt),
			)
		})

		it('shows no time for a message without one', () => {
			renderItem({ createdAt: null })

			expect(
				screen.queryByTestId(MESSAGE_ITEM.TIME),
			).not.toBeInTheDocument()
		})
	})

	describe('Message text', () => {
		it('shows a short message in full with no Show all', () => {
			renderItem()

			const text = screen.getByTestId(MESSAGE_ITEM.TEXT)
			expect(text).toHaveTextContent(SAMPLE_MESSAGE_ONE.message)
			expect(text).not.toHaveClass('line-clamp-5')
			expect(
				screen.queryByTestId(MESSAGE_ITEM.SHOW_ALL),
			).not.toBeInTheDocument()
		})

		it('does not clamp a message exactly at the clamp length', () => {
			renderItem({ message: 'a'.repeat(MESSAGES_CONFIG.CLAMP_LENGTH) })

			expect(
				screen.queryByTestId(MESSAGE_ITEM.SHOW_ALL),
			).not.toBeInTheDocument()
		})

		it('clamps a long message and toggles it with Show all and Show less', () => {
			renderItem({ message: LONG_MESSAGE })

			const text = screen.getByTestId(MESSAGE_ITEM.TEXT)
			const toggle = screen.getByTestId(MESSAGE_ITEM.SHOW_ALL)
			expect(text).toHaveClass('line-clamp-5')
			expect(toggle).toHaveTextContent(MESSAGES_CONFIG.SHOW_ALL)
			expect(toggle).toHaveAttribute('aria-expanded', 'false')
			expect(toggle).toHaveAttribute('aria-controls', text.id)

			fireEvent.click(toggle)

			expect(text).not.toHaveClass('line-clamp-5')
			expect(toggle).toHaveTextContent(MESSAGES_CONFIG.SHOW_LESS)
			expect(toggle).toHaveAttribute('aria-expanded', 'true')

			fireEvent.click(toggle)

			expect(text).toHaveClass('line-clamp-5')
			expect(toggle).toHaveAttribute('aria-expanded', 'false')
		})
	})

	describe('Reply', () => {
		it('passes the sender, message and time to the contact page', () => {
			renderItem()

			fireEvent.click(screen.getByTestId(MESSAGE_ITEM.REPLY))

			expect(
				JSON.parse(screen.getByTestId(CONTACT_STUB).textContent),
			).toEqual({
				replyTo: {
					name: SAMPLE_MESSAGE_ONE.senderName,
					message: SAMPLE_MESSAGE_ONE.message,
					createdAt: SAMPLE_MESSAGE_ONE.createdAt,
				},
			})
		})
	})

	describe('Delete', () => {
		it('names the sender in the Delete label and calls onDelete with the id', () => {
			const { onDelete, onRetry } = renderItem()

			const button = screen.getByRole('button', {
				name: MESSAGES_CONFIG.DELETE_LABEL(
					SAMPLE_MESSAGE_ONE.senderName,
				),
			})
			expect(button).toHaveTextContent(MESSAGES_CONFIG.DELETE)

			fireEvent.click(button)

			expect(onDelete).toHaveBeenCalledExactlyOnceWith(
				SAMPLE_MESSAGE_ONE.id,
			)
			expect(onRetry).not.toHaveBeenCalled()
		})

		it('names a legacy sender by email in the Delete label', () => {
			renderItem(legacyProps)

			expect(
				screen.getByRole('button', {
					name: MESSAGES_CONFIG.DELETE_LABEL(
						SAMPLE_MESSAGE_TWO.userEmail,
					),
				}),
			).toBeInTheDocument()
		})

		it('shows no error alert without a delete error', () => {
			renderItem()

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(MESSAGE_ITEM.TRY_AGAIN),
			).not.toBeInTheDocument()
		})

		it('shows the delete error with Try again, which calls onRetry with the id', () => {
			const { onRetry } = renderItem({ deleteError: DELETE_ERROR })

			expect(screen.getByRole('alert')).toHaveTextContent(DELETE_ERROR)

			const retry = screen.getByTestId(MESSAGE_ITEM.TRY_AGAIN)
			expect(retry).toHaveTextContent(MESSAGES_CONFIG.TRY_AGAIN)
			expect(retry).toBeEnabled()
			expect(retry).toHaveAttribute('aria-busy', 'false')

			fireEvent.click(retry)

			expect(onRetry).toHaveBeenCalledExactlyOnceWith(
				SAMPLE_MESSAGE_ONE.id,
			)
		})

		it('disables Try again while retrying', () => {
			const { onRetry } = renderItem({
				deleteError: DELETE_ERROR,
				isRetrying: true,
			})

			const retry = screen.getByTestId(MESSAGE_ITEM.TRY_AGAIN)
			expect(retry).toBeDisabled()
			expect(retry).toHaveAttribute('aria-busy', 'true')

			fireEvent.click(retry)

			expect(onRetry).not.toHaveBeenCalled()
		})
	})
})
