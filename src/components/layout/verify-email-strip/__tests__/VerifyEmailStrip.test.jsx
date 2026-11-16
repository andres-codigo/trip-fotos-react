import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

import {
	VERIFY_EMAIL_PROMPT_CONFIG,
	VERIFY_EMAIL_STATUS,
} from '@/constants/auth'
import { VERIFY_EMAIL_STRIP } from '@/constants/test'
import useVerifyEmail from '@/utils/useVerifyEmail'

import VerifyEmailStrip from '@/components/layout/verify-email-strip/VerifyEmailStrip'

vi.mock('@/utils/useVerifyEmail', () => ({ default: vi.fn() }))

const EMAIL = 'name@example.com'

const renderStrip = (status = VERIFY_EMAIL_STATUS.IDLE, props = {}) => {
	const hook = { email: EMAIL, status, resend: vi.fn(), check: vi.fn() }
	useVerifyEmail.mockReturnValue(hook)
	const view = render(<VerifyEmailStrip {...props} />)
	return { ...hook, ...view }
}

const queryLink = (name) => screen.queryByRole('button', { name })

describe('<VerifyEmailStrip />', () => {
	beforeEach(() => {
		useVerifyEmail.mockReset()
	})

	it('renders a labelled region with the prompt and the email', () => {
		renderStrip()
		const region = screen.getByRole('region', {
			name: VERIFY_EMAIL_PROMPT_CONFIG.STRIP_LABEL,
		})
		expect(region).toHaveAttribute('data-cy', VERIFY_EMAIL_STRIP.ROOT)
		expect(region).toHaveTextContent(
			`${VERIFY_EMAIL_PROMPT_CONFIG.STRIP_TITLE} ${VERIFY_EMAIL_PROMPT_CONFIG.STRIP_TEXT} ${VERIFY_EMAIL_PROMPT_CONFIG.SENT_LINK_TO} ${EMAIL}.`,
		)
	})

	it('keeps focus in the strip when a clicked link gives way to the busy line', () => {
		renderStrip()
		const link = queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN)
		link.focus()
		fireEvent.click(link)
		expect(document.activeElement).toHaveAttribute('tabindex', '-1')
		expect(document.activeElement).toContainElement(link)
	})

	it('merges a className last', () => {
		renderStrip(VERIFY_EMAIL_STATUS.IDLE, { className: 'px-8' })
		const region = screen.getByRole('region')
		expect(region).toHaveClass('px-8')
		expect(region).not.toHaveClass('px-4')
	})

	it('offers both links when idle and calls the hook on click', () => {
		const { resend, check } = renderStrip()
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		fireEvent.click(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN))
		fireEvent.click(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK))
		expect(resend).toHaveBeenCalledTimes(1)
		expect(check).toHaveBeenCalledTimes(1)
	})

	it.each([
		[VERIFY_EMAIL_STATUS.NOT_YET, VERIFY_EMAIL_PROMPT_CONFIG.NOT_YET],
		[
			VERIFY_EMAIL_STATUS.CHECK_FAILED,
			VERIFY_EMAIL_PROMPT_CONFIG.CHECK_FAILED,
		],
	])('shows an alert and keeps both links when %s', (status, copy) => {
		const { resend, check } = renderStrip(status)
		const alert = screen.getByRole('alert')
		expect(alert).toHaveTextContent(copy)
		expect(alert).toHaveAttribute('data-cy', VERIFY_EMAIL_STRIP.MESSAGE)
		fireEvent.click(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN))
		fireEvent.click(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK))
		expect(resend).toHaveBeenCalledTimes(1)
		expect(check).toHaveBeenCalledTimes(1)
	})

	it.each([
		[VERIFY_EMAIL_STATUS.SENDING, VERIFY_EMAIL_PROMPT_CONFIG.SENDING],
		[VERIFY_EMAIL_STATUS.CHECKING, VERIFY_EMAIL_PROMPT_CONFIG.CHECKING],
	])('replaces the links with a busy status when %s', (status, copy) => {
		const { container } = renderStrip(status)
		const busy = container.querySelector(
			`[data-cy="${VERIFY_EMAIL_STRIP.BUSY}"]`,
		)
		expect(within(busy).getByRole('status')).toHaveTextContent(copy)
		expect(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN)).toBeNull()
		expect(queryLink(VERIFY_EMAIL_PROMPT_CONFIG.CHECK)).toBeNull()
	})

	it('confirms the send with a status and no links when sent', () => {
		renderStrip(VERIFY_EMAIL_STATUS.SENT)
		const status = screen.getByRole('status')
		expect(status).toHaveTextContent(
			VERIFY_EMAIL_PROMPT_CONFIG.SENT_TO(EMAIL),
		)
		expect(status).toHaveAttribute('data-cy', VERIFY_EMAIL_STRIP.MESSAGE)
		expect(screen.queryAllByRole('button')).toHaveLength(0)
	})

	it('shows an alert and no links when the send failed', () => {
		renderStrip(VERIFY_EMAIL_STATUS.NOT_SENT)
		const alert = screen.getByRole('alert')
		expect(alert).toHaveTextContent(VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT)
		expect(alert).toHaveAttribute('data-cy', VERIFY_EMAIL_STRIP.MESSAGE)
		expect(screen.queryAllByRole('button')).toHaveLength(0)
	})
})
