import { createRef } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import { RESEND_COOLDOWN_SECONDS, VERIFY_EMAIL_CONFIG } from '@/constants/auth'

import VerifyEmailInbox from '@/components/forms/verify-email/VerifyEmailInbox'

const EMAIL = 'name@example.com'
const NOW = new Date('2026-11-15T10:00:00Z').getTime()

const renderInbox = (props = {}) => {
	const handlers = {
		onResend: vi.fn(),
		onCheck: vi.fn(),
		onStartAgain: vi.fn(),
	}
	const ref = createRef()
	const view = render(
		<VerifyEmailInbox
			ref={ref}
			email={EMAIL}
			{...handlers}
			{...props}
		/>,
	)
	return { ...handlers, ref, ...view }
}

const queryResend = () =>
	screen.queryByRole('button', { name: VERIFY_EMAIL_CONFIG.SEND_AGAIN })

describe('<VerifyEmailInbox />', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(NOW)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('gives the focusable heading to the ref', () => {
		const { ref } = renderInbox()
		const heading = screen.getByRole('heading', {
			level: 1,
			name: VERIFY_EMAIL_CONFIG.TITLE,
		})
		expect(ref.current).toBe(heading)
		expect(heading).toHaveAttribute('tabIndex', '-1')
	})

	it('says the first link was sent, with the email in bold', () => {
		renderInbox()
		const status = screen.getByRole('status')
		expect(status).toHaveTextContent(
			`${VERIFY_EMAIL_CONFIG.SENT_PREFIX} ${EMAIL}${VERIFY_EMAIL_CONFIG.SENT_SUFFIX}`,
		)
		expect(status.querySelector('strong')).toHaveTextContent(EMAIL)
	})

	it('says another link was sent when resent', () => {
		renderInbox({ resent: true })
		expect(screen.getByRole('status')).toHaveTextContent(
			`${VERIFY_EMAIL_CONFIG.RESENT_PREFIX} ${EMAIL}${VERIFY_EMAIL_CONFIG.RESENT_SUFFIX}`,
		)
	})

	it('offers to send again when there is no cooldown', () => {
		const { onResend } = renderInbox()
		expect(
			screen.getByText(VERIFY_EMAIL_CONFIG.HINT_PREFIX, { exact: false }),
		).toBeInTheDocument()
		fireEvent.click(queryResend())
		expect(onResend).toHaveBeenCalledTimes(1)
	})

	it('counts the cooldown down, then brings the send-again link back', () => {
		const { onResend } = renderInbox({
			cooldownEndsAt: NOW + RESEND_COOLDOWN_SECONDS * 1000,
		})
		expect(
			screen.getByText(
				VERIFY_EMAIL_CONFIG.COOLDOWN(RESEND_COOLDOWN_SECONDS),
			),
		).toBeInTheDocument()
		expect(queryResend()).not.toBeInTheDocument()

		act(() => vi.advanceTimersByTime(1000))
		expect(
			screen.getByText(
				VERIFY_EMAIL_CONFIG.COOLDOWN(RESEND_COOLDOWN_SECONDS - 1),
			),
		).toBeInTheDocument()

		act(() => vi.advanceTimersByTime((RESEND_COOLDOWN_SECONDS - 1) * 1000))
		expect(
			screen.queryByText(/You can send it again in/),
		).not.toBeInTheDocument()
		fireEvent.click(queryResend())
		expect(onResend).toHaveBeenCalledTimes(1)
	})

	it('restarts the countdown when a new cooldown arrives', () => {
		const props = { cooldownEndsAt: NOW + 5000 }
		const { rerender, onResend, onCheck, onStartAgain } = renderInbox(props)
		act(() => vi.advanceTimersByTime(5000))
		expect(queryResend()).toBeInTheDocument()

		rerender(
			<VerifyEmailInbox
				email={EMAIL}
				onResend={onResend}
				onCheck={onCheck}
				onStartAgain={onStartAgain}
				cooldownEndsAt={Date.now() + RESEND_COOLDOWN_SECONDS * 1000}
			/>,
		)
		expect(
			screen.getByText(
				VERIFY_EMAIL_CONFIG.COOLDOWN(RESEND_COOLDOWN_SECONDS),
			),
		).toBeInTheDocument()
	})

	it('stops the interval on unmount', () => {
		const { unmount } = renderInbox({ cooldownEndsAt: NOW + 10000 })
		expect(vi.getTimerCount()).toBe(1)
		unmount()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('shows nothing clickable to resend while a resend is in flight', () => {
		renderInbox({ isSending: true })
		expect(queryResend()).not.toBeInTheDocument()
	})

	it('shows the check button busy while checking', () => {
		renderInbox({ isChecking: true })
		const button = screen.getByRole('button', {
			name: VERIFY_EMAIL_CONFIG.CHECKING,
		})
		expect(button).toHaveAttribute('aria-busy', 'true')
		expect(button).toBeDisabled()
	})

	it('calls onCheck from the check button', () => {
		const { onCheck } = renderInbox()
		fireEvent.click(
			screen.getByRole('button', { name: VERIFY_EMAIL_CONFIG.CHECK }),
		)
		expect(onCheck).toHaveBeenCalledTimes(1)
	})

	it('shows an error as an alert only when there is one', () => {
		const { rerender, onResend, onCheck, onStartAgain } = renderInbox()
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		const message = VERIFY_EMAIL_CONFIG.NOT_YET(EMAIL)
		rerender(
			<VerifyEmailInbox
				email={EMAIL}
				onResend={onResend}
				onCheck={onCheck}
				onStartAgain={onStartAgain}
				error={message}
			/>,
		)
		expect(screen.getByRole('alert')).toHaveTextContent(message)
	})

	it('calls onStartAgain from the wrong-address link', () => {
		const { onStartAgain } = renderInbox()
		expect(
			screen.getByText(VERIFY_EMAIL_CONFIG.WRONG_ADDRESS_PROMPT, {
				exact: false,
			}),
		).toBeInTheDocument()
		fireEvent.click(
			screen.getByRole('button', {
				name: VERIFY_EMAIL_CONFIG.START_AGAIN,
			}),
		)
		expect(onStartAgain).toHaveBeenCalledTimes(1)
	})
})
