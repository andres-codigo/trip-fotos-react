import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDispatch, useSelector } from 'react-redux'

import { RESEND_COOLDOWN_SECONDS, VERIFY_EMAIL_STATUS } from '@/constants/auth'

import useVerifyEmail from '@/utils/useVerifyEmail'
import {
	refreshVerification,
	resendVerification,
} from '@/store/slices/authenticationSlice'

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

vi.mock('@/store/slices/authenticationSlice', () => {
	const thunk = (type) =>
		Object.assign(
			vi.fn(() => ({ type })),
			{ rejected: { match: (result) => result?.rejected === true } },
		)
	return {
		resendVerification: thunk('resend'),
		refreshVerification: thunk('refresh'),
		selectUserEmail: vi.fn(),
	}
})

const EMAIL = 'traveller@example.com'
const COOLDOWN_MS = RESEND_COOLDOWN_SECONDS * 1000

const deferred = () => {
	let resolve
	const promise = new Promise((r) => {
		resolve = r
	})
	return { promise, resolve }
}

describe('useVerifyEmail', () => {
	const dispatch = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		vi.useFakeTimers()
		useDispatch.mockReturnValue(dispatch)
		useSelector.mockReturnValue(EMAIL)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('starts idle with the signed-in email', () => {
		const { result } = renderHook(() => useVerifyEmail())

		expect(result.current.email).toBe(EMAIL)
		expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.IDLE)
	})

	it('keeps resend and check stable across renders', () => {
		const { result, rerender } = renderHook(() => useVerifyEmail())
		const { resend, check } = result.current

		rerender()

		expect(result.current.resend).toBe(resend)
		expect(result.current.check).toBe(check)
	})

	describe('resend', () => {
		it('shows sending while the email is on its way', async () => {
			const pending = deferred()
			dispatch.mockReturnValue(pending.promise)
			const { result } = renderHook(() => useVerifyEmail())

			act(() => {
				result.current.resend()
			})

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.SENDING)
			expect(dispatch).toHaveBeenCalledWith(resendVerification())

			await act(async () => pending.resolve({}))
		})

		it('moves to sent when the email goes', async () => {
			dispatch.mockResolvedValue({ payload: EMAIL })
			const { result } = renderHook(() => useVerifyEmail())

			await act(() => result.current.resend())

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.SENT)
		})

		it('moves to not sent when the email fails', async () => {
			dispatch.mockResolvedValue({ rejected: true, payload: 'Nope' })
			const { result } = renderHook(() => useVerifyEmail())

			await act(() => result.current.resend())

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.NOT_SENT)
		})

		it.each([
			['sent', {}],
			['not sent', { rejected: true }],
		])(
			'goes back to idle after the cooldown when %s',
			async (_, outcome) => {
				dispatch.mockResolvedValue(outcome)
				const { result } = renderHook(() => useVerifyEmail())

				await act(() => result.current.resend())
				act(() => vi.advanceTimersByTime(COOLDOWN_MS - 1))
				expect(result.current.status).not.toBe(VERIFY_EMAIL_STATUS.IDLE)

				act(() => vi.advanceTimersByTime(1))
				expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.IDLE)
			},
		)
	})

	describe('check', () => {
		it('shows checking while the account reloads', async () => {
			const pending = deferred()
			dispatch.mockReturnValue(pending.promise)
			const { result } = renderHook(() => useVerifyEmail())

			act(() => {
				result.current.check()
			})

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.CHECKING)
			expect(dispatch).toHaveBeenCalledWith(refreshVerification())

			await act(async () => pending.resolve({}))
		})

		it('goes back to idle once the email is verified', async () => {
			dispatch.mockResolvedValue({ payload: { emailVerified: true } })
			const { result } = renderHook(() => useVerifyEmail())

			await act(() => result.current.check())

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.IDLE)
		})

		it('moves to not yet while the email is unverified', async () => {
			dispatch.mockResolvedValue({ payload: { emailVerified: false } })
			const { result } = renderHook(() => useVerifyEmail())

			await act(() => result.current.check())

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.NOT_YET)
		})

		it('moves to check failed when the reload fails', async () => {
			dispatch.mockResolvedValue({ rejected: true, payload: 'Nope' })
			const { result } = renderHook(() => useVerifyEmail())

			await act(() => result.current.check())

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.CHECK_FAILED)
		})

		it('cancels a pending cooldown', async () => {
			dispatch.mockResolvedValueOnce({})
			dispatch.mockResolvedValueOnce({
				payload: { emailVerified: false },
			})
			const { result } = renderHook(() => useVerifyEmail())

			await act(() => result.current.resend())
			await act(() => result.current.check())
			act(() => vi.advanceTimersByTime(COOLDOWN_MS))

			expect(result.current.status).toBe(VERIFY_EMAIL_STATUS.NOT_YET)
		})
	})

	describe('while busy', () => {
		it.each([
			['sending', 'resend'],
			['checking', 'check'],
		])('ignores both actions while %s', async (_, first) => {
			const pending = deferred()
			dispatch.mockReturnValue(pending.promise)
			const { result } = renderHook(() => useVerifyEmail())

			act(() => {
				result.current[first]()
				result.current.resend()
				result.current.check()
			})

			expect(dispatch).toHaveBeenCalledTimes(1)

			await act(async () => pending.resolve({}))
		})
	})

	describe('on unmount', () => {
		it('clears the cooldown timer', async () => {
			dispatch.mockResolvedValue({})
			const { result, unmount } = renderHook(() => useVerifyEmail())

			await act(() => result.current.resend())
			expect(vi.getTimerCount()).toBe(1)

			unmount()

			expect(vi.getTimerCount()).toBe(0)
		})

		it('does not start a cooldown when the send settles after unmount', async () => {
			const pending = deferred()
			dispatch.mockReturnValue(pending.promise)
			const { result, unmount } = renderHook(() => useVerifyEmail())

			act(() => {
				result.current.resend()
			})
			unmount()
			await act(async () => pending.resolve({}))

			expect(vi.getTimerCount()).toBe(0)
		})
	})
})
