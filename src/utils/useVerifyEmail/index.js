import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { RESEND_COOLDOWN_SECONDS, VERIFY_EMAIL_STATUS } from '@/constants/auth'

import {
	refreshVerification,
	resendVerification,
	selectUserEmail,
} from '@/store/slices/authenticationSlice'

const BUSY = [VERIFY_EMAIL_STATUS.SENDING, VERIFY_EMAIL_STATUS.CHECKING]

function useVerifyEmail() {
	const dispatch = useDispatch()
	const email = useSelector(selectUserEmail)
	const [status, setStatus] = useState(VERIFY_EMAIL_STATUS.IDLE)
	// A ref, so a second click in the same render is still ignored while busy
	const statusRef = useRef(VERIFY_EMAIL_STATUS.IDLE)
	const timerRef = useRef(null)
	const mountedRef = useRef(true)

	const update = useCallback((next) => {
		statusRef.current = next
		if (mountedRef.current) setStatus(next)
	}, [])

	const clearTimer = useCallback(() => {
		clearTimeout(timerRef.current)
		timerRef.current = null
	}, [])

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
			clearTimer()
		}
	}, [clearTimer])

	const resend = useCallback(async () => {
		if (BUSY.includes(statusRef.current)) return
		clearTimer()
		update(VERIFY_EMAIL_STATUS.SENDING)

		const result = await dispatch(resendVerification())
		if (!mountedRef.current) return

		update(
			resendVerification.rejected.match(result)
				? VERIFY_EMAIL_STATUS.NOT_SENT
				: VERIFY_EMAIL_STATUS.SENT,
		)
		timerRef.current = setTimeout(
			() => update(VERIFY_EMAIL_STATUS.IDLE),
			RESEND_COOLDOWN_SECONDS * 1000,
		)
	}, [dispatch, clearTimer, update])

	const check = useCallback(async () => {
		if (BUSY.includes(statusRef.current)) return
		clearTimer()
		update(VERIFY_EMAIL_STATUS.CHECKING)

		const result = await dispatch(refreshVerification())
		if (!mountedRef.current) return

		if (refreshVerification.rejected.match(result)) {
			update(VERIFY_EMAIL_STATUS.CHECK_FAILED)
		} else if (result.payload?.emailVerified) {
			update(VERIFY_EMAIL_STATUS.IDLE)
		} else {
			update(VERIFY_EMAIL_STATUS.NOT_YET)
		}
	}, [dispatch, clearTimer, update])

	return { email, status, resend, check }
}

export default useVerifyEmail
