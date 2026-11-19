import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import {
	VERIFY_EMAIL_PROMPT_CONFIG,
	VERIFY_EMAIL_STATUS,
} from '@/constants/auth'
import { VERIFY_EMAIL_NOTE } from '@/constants/test'

import useVerifyEmail from '@/utils/useVerifyEmail'

import VerifyEmailNote from '@/components/forms/verify-email-note/VerifyEmailNote'

vi.mock('@/utils/useVerifyEmail', () => ({ default: vi.fn() }))

const EMAIL = 'name@example.com'
const resend = vi.fn()
const check = vi.fn()

const renderNote = (status = VERIFY_EMAIL_STATUS.IDLE, props = {}) => {
	useVerifyEmail.mockReturnValue({ email: EMAIL, status, resend, check })
	return render(<VerifyEmailNote {...props} />)
}

const queryLink = (name) => screen.queryByRole('button', { name })

const ERRORS = [
	[VERIFY_EMAIL_STATUS.NOT_SENT, VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT],
	[VERIFY_EMAIL_STATUS.NOT_YET, VERIFY_EMAIL_PROMPT_CONFIG.NOT_YET],
	[VERIFY_EMAIL_STATUS.CHECK_FAILED, VERIFY_EMAIL_PROMPT_CONFIG.CHECK_FAILED],
]

const BUSY = [
	[VERIFY_EMAIL_STATUS.SENDING, VERIFY_EMAIL_PROMPT_CONFIG.SENDING],
	[VERIFY_EMAIL_STATUS.CHECKING, VERIFY_EMAIL_PROMPT_CONFIG.CHECKING],
]

describe('<VerifyEmailNote />', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('card', () => {
		it('shows the title, the explanation and the email by default', () => {
			renderNote(VERIFY_EMAIL_STATUS.IDLE, {
				text: VERIFY_EMAIL_PROMPT_CONFIG.REGISTER_NOTE,
			})
			const root = screen.queryByTestId(VERIFY_EMAIL_NOTE.ROOT)
			expect(root).toHaveAttribute('data-variant', 'card')
			expect(root.querySelector('svg')).toHaveAttribute(
				'aria-hidden',
				'true',
			)
			expect(
				screen.queryByTestId(VERIFY_EMAIL_NOTE.TITLE),
			).toHaveTextContent(VERIFY_EMAIL_PROMPT_CONFIG.NOTE_TITLE)
			expect(root).toHaveTextContent(
				`${VERIFY_EMAIL_PROMPT_CONFIG.REGISTER_NOTE} ${VERIFY_EMAIL_PROMPT_CONFIG.SENT_LINK_TO} ${EMAIL}.`,
			)
		})
	})

	describe('bar', () => {
		it('shows the reply title and the email, with no icon', () => {
			renderNote(VERIFY_EMAIL_STATUS.IDLE, {
				variant: 'bar',
				text: VERIFY_EMAIL_PROMPT_CONFIG.REGISTER_NOTE,
			})
			const root = screen.getByTestId(VERIFY_EMAIL_NOTE.ROOT)
			expect(root).toHaveAttribute('data-variant', 'bar')
			expect(root.querySelector('svg')).toBeNull()
			expect(root).toHaveTextContent(
				`${VERIFY_EMAIL_PROMPT_CONFIG.REPLY_NOTE_TITLE} ${VERIFY_EMAIL_PROMPT_CONFIG.SENT_LINK_TO} ${EMAIL}.`,
			)
			expect(root).not.toHaveTextContent(
				VERIFY_EMAIL_PROMPT_CONFIG.REGISTER_NOTE,
			)
		})
	})

	describe.each(['card', 'bar'])('%s statuses', (variant) => {
		it('offers both links when idle, with no status line', () => {
			renderNote(VERIFY_EMAIL_STATUS.IDLE, { variant })
			fireEvent.click(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN))
			fireEvent.click(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK))
			expect(resend).toHaveBeenCalledTimes(1)
			expect(check).toHaveBeenCalledTimes(1)
			expect(screen.queryByRole('status')).toBeNull()
			expect(screen.queryByRole('alert')).toBeNull()
		})

		it('keeps focus in the note when a clicked link gives way to the busy line', () => {
			renderNote(VERIFY_EMAIL_STATUS.IDLE, { variant })
			const link = queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK)
			link.focus()
			fireEvent.click(link)
			expect(document.activeElement).toHaveAttribute('tabindex', '-1')
			expect(document.activeElement).toContainElement(link)
		})

		it('says the link was sent and keeps the links', () => {
			renderNote(VERIFY_EMAIL_STATUS.SENT, { variant })
			const status = screen.getByRole('status')
			expect(status).toHaveTextContent(VERIFY_EMAIL_PROMPT_CONFIG.SENT)
			expect(status).toHaveAttribute('data-cy', VERIFY_EMAIL_NOTE.MESSAGE)
			expect(
				queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN),
			).toBeInTheDocument()
			expect(
				queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK),
			).toBeInTheDocument()
		})

		it.each(ERRORS)('alerts on %s and keeps the links', (status, copy) => {
			renderNote(status, { variant })
			const alert = screen.getByRole('alert')
			expect(alert).toHaveTextContent(copy)
			expect(alert).toHaveAttribute('data-cy', VERIFY_EMAIL_NOTE.MESSAGE)
			expect(
				queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN),
			).toBeInTheDocument()
			expect(
				queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK),
			).toBeInTheDocument()
		})

		it.each(BUSY)('replaces the links while %s', (status, label) => {
			renderNote(status, { variant })
			const busy = screen.queryByTestId(VERIFY_EMAIL_NOTE.BUSY)
			expect(busy).toHaveTextContent(label)
			expect(screen.getByRole('status')).toHaveTextContent(label)
			expect(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN)).toBeNull()
			expect(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK)).toBeNull()
			expect(screen.queryByRole('alert')).toBeNull()
		})
	})
})
