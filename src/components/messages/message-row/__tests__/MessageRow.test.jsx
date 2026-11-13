import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MESSAGE_ROW, MOCK_INBOX } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import MessageRow from '@/components/messages/message-row/MessageRow'
import { formatFullTime } from '@/utils/formatMessageTime'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const SEARCH_STUB = 'search-stub'

const SearchStub = () => {
	const location = useLocation()
	return <p data-cy={SEARCH_STUB}>{location.search}</p>
}

const travellerProps = {
	id: SAMPLE_MESSAGE_ONE.id,
	senderName: SAMPLE_MESSAGE_ONE.senderName,
	senderStatus: SAMPLE_MESSAGE_ONE.senderStatus,
	message: SAMPLE_MESSAGE_ONE.message,
	createdAt: SAMPLE_MESSAGE_ONE.createdAt,
}

const legacyProps = {
	id: SAMPLE_MESSAGE_TWO.id,
	senderName: SAMPLE_MESSAGE_TWO.senderName,
	senderStatus: SAMPLE_MESSAGE_TWO.senderStatus,
	userEmail: SAMPLE_MESSAGE_TWO.userEmail,
	message: SAMPLE_MESSAGE_TWO.message,
	createdAt: SAMPLE_MESSAGE_TWO.createdAt,
}

const renderRow = (props = {}) => {
	const onSelect = vi.fn()

	render(
		<MemoryRouter initialEntries={['/messages']}>
			<Routes>
				<Route
					path="/messages"
					element={
						<>
							<ul>
								<MessageRow
									{...travellerProps}
									onSelect={onSelect}
									{...props}
								/>
							</ul>
							<SearchStub />
						</>
					}
				/>
			</Routes>
		</MemoryRouter>,
	)

	return { onSelect }
}

describe('<MessageRow />', () => {
	describe('Rendering', () => {
		it('renders a list item with the message id and a link to open it', () => {
			renderRow()

			const root = screen.getByTestId(MESSAGE_ROW.ROOT)
			expect(root.tagName).toBe('LI')
			expect(root).toHaveAttribute(
				'data-message-id',
				SAMPLE_MESSAGE_ONE.id,
			)

			const link = screen.getByTestId(MESSAGE_ROW.LINK)
			expect(root).toContainElement(link)
			expect(link).toHaveAttribute(
				'href',
				`/messages?${MESSAGES_CONFIG.MESSAGE_PARAM}=${SAMPLE_MESSAGE_ONE.id}`,
			)
		})

		it('shows the whole message in the preview', () => {
			renderRow()

			const preview = screen.getByTestId(MESSAGE_ROW.PREVIEW)
			expect(preview).toHaveTextContent(SAMPLE_MESSAGE_ONE.message)
			expect(preview).toHaveClass('truncate')
		})
	})

	describe('Sender', () => {
		it('names a traveller sender', () => {
			renderRow()

			expect(screen.getByTestId(MESSAGE_ROW.SENDER)).toHaveTextContent(
				SAMPLE_MESSAGE_ONE.senderName,
			)
		})

		it('names an unknown sender "A traveller"', () => {
			renderRow({ senderName: null, senderStatus: SENDER_STATUS.UNKNOWN })

			expect(screen.getByTestId(MESSAGE_ROW.SENDER)).toHaveTextContent(
				MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
			)
		})

		it('names a former traveller', () => {
			renderRow({ senderName: null, senderStatus: SENDER_STATUS.FORMER })

			expect(screen.getByTestId(MESSAGE_ROW.SENDER)).toHaveTextContent(
				MESSAGES_CONFIG.FORMER_TRAVELLER,
			)
		})

		it('shows a legacy sender by email, with no time', () => {
			renderRow(legacyProps)

			expect(screen.getByTestId(MESSAGE_ROW.SENDER)).toHaveTextContent(
				SAMPLE_MESSAGE_TWO.userEmail,
			)
			expect(
				screen.queryByTestId(MESSAGE_ROW.TIME),
			).not.toBeInTheDocument()
		})
	})

	describe('New', () => {
		it('shows the dot, bolds the sender and adds ", new" for screen readers', () => {
			renderRow({ isNew: true })

			expect(screen.getByTestId(MESSAGE_ROW.LINK)).toHaveAttribute(
				'data-new',
				'true',
			)
			expect(screen.getByTestId(MESSAGE_ROW.DOT)).toHaveAttribute(
				'aria-hidden',
				'true',
			)

			const sender = screen.getByTestId(MESSAGE_ROW.SENDER)
			expect(sender).toHaveClass('font-bold')
			expect(sender).toHaveTextContent(
				`${SAMPLE_MESSAGE_ONE.senderName}${MESSAGES_CONFIG.NEW_ROW_HIDDEN}`,
			)
			expect(
				screen.getByText(MESSAGES_CONFIG.NEW_ROW_HIDDEN.trim()),
			).toHaveClass('sr-only')
		})

		it('shows no marker for a read message', () => {
			renderRow()

			expect(screen.getByTestId(MESSAGE_ROW.LINK)).not.toHaveAttribute(
				'data-new',
			)
			expect(
				screen.queryByTestId(MESSAGE_ROW.DOT),
			).not.toBeInTheDocument()

			const sender = screen.getByTestId(MESSAGE_ROW.SENDER)
			expect(sender).not.toHaveClass('font-bold')
			expect(sender.textContent).toBe(SAMPLE_MESSAGE_ONE.senderName)
		})
	})

	describe('Open', () => {
		it('marks the open row as current', () => {
			renderRow({ isOpen: true })

			const link = screen.getByTestId(MESSAGE_ROW.LINK)
			expect(link).toHaveAttribute('aria-current', 'true')
			expect(link).toHaveAttribute('data-open', 'true')
			expect(link).toHaveClass('bg-surface-accent')
		})

		it('does not mark a closed row', () => {
			renderRow()

			const link = screen.getByTestId(MESSAGE_ROW.LINK)
			expect(link).not.toHaveAttribute('aria-current')
			expect(link).not.toHaveAttribute('data-open')
			expect(link).not.toHaveClass('bg-surface-accent')
		})
	})

	describe('Select', () => {
		it('calls onSelect with the id and navigates to the message', () => {
			const { onSelect } = renderRow()

			fireEvent.click(screen.getByTestId(MESSAGE_ROW.LINK))

			expect(onSelect).toHaveBeenCalledExactlyOnceWith(
				SAMPLE_MESSAGE_ONE.id,
			)
			expect(screen.getByTestId(SEARCH_STUB)).toHaveTextContent(
				`?${MESSAGES_CONFIG.MESSAGE_PARAM}=${SAMPLE_MESSAGE_ONE.id}`,
			)
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
			renderRow()

			const time = screen.getByTestId(MESSAGE_ROW.TIME)
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
	})
})
