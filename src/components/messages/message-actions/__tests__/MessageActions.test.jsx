import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { MESSAGE_ACTIONS, MOCK_INBOX } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import MessageActions from '@/components/messages/message-actions/MessageActions'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const CONTACT_STUB = 'contact-stub'
const DELETE_ERROR = 'This message could not be deleted.'

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
	sender: SAMPLE_MESSAGE_ONE.senderName,
}

const legacyProps = {
	id: SAMPLE_MESSAGE_TWO.id,
	senderId: SAMPLE_MESSAGE_TWO.senderId,
	senderName: SAMPLE_MESSAGE_TWO.senderName,
	createdAt: SAMPLE_MESSAGE_TWO.createdAt,
	senderStatus: SAMPLE_MESSAGE_TWO.senderStatus,
	userEmail: SAMPLE_MESSAGE_TWO.userEmail,
	message: SAMPLE_MESSAGE_TWO.message,
	sender: SAMPLE_MESSAGE_TWO.userEmail,
}

const renderActions = (props = {}) => {
	const onDelete = vi.fn()
	const onRetry = vi.fn()

	render(
		<MemoryRouter initialEntries={['/messages']}>
			<Routes>
				<Route
					path="/messages"
					element={
						<MessageActions
							{...travellerProps}
							onDelete={onDelete}
							onRetry={onRetry}
							{...props}
						/>
					}
				/>
				<Route
					path="/travellers/:id/contact"
					element={<ContactStub />}
				/>
			</Routes>
		</MemoryRouter>,
	)

	return { onDelete, onRetry }
}

describe('<MessageActions />', () => {
	describe('Row', () => {
		it('merges a className onto the actions row', () => {
			renderActions({ className: 'mt-3' })

			const root = screen.getByTestId(MESSAGE_ACTIONS.ROOT)
			expect(root).toHaveClass('flex', 'mt-3')
		})
	})

	describe('Reply', () => {
		it('offers Reply to the contact page for a traveller', () => {
			renderActions()

			const reply = screen.getByTestId(MESSAGE_ACTIONS.REPLY)
			expect(reply).toHaveTextContent(MESSAGES_CONFIG.REPLY)
			expect(reply).toHaveAttribute(
				'href',
				`/travellers/${SAMPLE_MESSAGE_ONE.senderId}/contact`,
			)
		})

		it('offers Reply for an unknown sender', () => {
			renderActions({
				senderName: null,
				senderStatus: SENDER_STATUS.UNKNOWN,
				sender: MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
			})

			expect(screen.getByTestId(MESSAGE_ACTIONS.REPLY)).toHaveAttribute(
				'href',
				`/travellers/${SAMPLE_MESSAGE_ONE.senderId}/contact`,
			)
		})

		it('offers no Reply for a former traveller', () => {
			renderActions({
				senderName: null,
				senderStatus: SENDER_STATUS.FORMER,
				sender: MESSAGES_CONFIG.FORMER_TRAVELLER,
			})

			expect(
				screen.queryByTestId(MESSAGE_ACTIONS.REPLY),
			).not.toBeInTheDocument()
			expect(
				screen.getByTestId(MESSAGE_ACTIONS.DELETE),
			).toBeInTheDocument()
		})

		it('offers a Reply by email mailto link for a legacy sender', () => {
			renderActions(legacyProps)

			const reply = screen.getByTestId(MESSAGE_ACTIONS.REPLY)
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

		it('offers no Reply for a legacy message without an email', () => {
			renderActions({ ...legacyProps, userEmail: null })

			expect(
				screen.queryByTestId(MESSAGE_ACTIONS.REPLY),
			).not.toBeInTheDocument()
		})

		it('passes the sender, message and time to the contact page', () => {
			renderActions()

			fireEvent.click(screen.getByTestId(MESSAGE_ACTIONS.REPLY))

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
			const { onDelete, onRetry } = renderActions()

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

		it('shows no error alert without a delete error', () => {
			renderActions()

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(MESSAGE_ACTIONS.TRY_AGAIN),
			).not.toBeInTheDocument()
		})

		it('shows the delete error with Try again, which calls onRetry with the id', () => {
			const { onRetry } = renderActions({ deleteError: DELETE_ERROR })

			expect(screen.getByRole('alert')).toHaveTextContent(DELETE_ERROR)

			const retry = screen.getByTestId(MESSAGE_ACTIONS.TRY_AGAIN)
			expect(retry).toHaveTextContent(MESSAGES_CONFIG.TRY_AGAIN)
			expect(retry).toBeEnabled()
			expect(retry).toHaveAttribute('aria-busy', 'false')

			fireEvent.click(retry)

			expect(onRetry).toHaveBeenCalledExactlyOnceWith(
				SAMPLE_MESSAGE_ONE.id,
			)
		})

		it('disables Try again and reads Trying again while retrying', () => {
			const { onRetry } = renderActions({
				deleteError: DELETE_ERROR,
				isRetrying: true,
			})

			const retry = screen.getByTestId(MESSAGE_ACTIONS.TRY_AGAIN)
			expect(retry).toHaveTextContent(MESSAGES_CONFIG.TRYING_AGAIN)
			expect(retry).toBeDisabled()
			expect(retry).toHaveAttribute('aria-busy', 'true')

			fireEvent.click(retry)

			expect(onRetry).not.toHaveBeenCalled()
		})
	})
})
