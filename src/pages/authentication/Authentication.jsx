import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { matchPath, useNavigate, useLocation } from 'react-router-dom'

import { API_DATABASE } from '@/constants/api'
import {
	AUTH_FORM_CONFIG,
	PASSWORD_RESET_CONFIG,
	RESEND_COOLDOWN_SECONDS,
	VERIFY_EMAIL_CONFIG,
} from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import {
	authActions,
	login,
	refreshVerification,
	resendVerification,
	sendPasswordReset,
	startAgain,
} from '@/store/slices/authenticationSlice'
import { selectPublicTrips } from '@/store/slices/travellersSlice'

import useFormField from '@/components/forms/user-authentication/hooks/useFormField'

import { handleApiError } from '@/utils/errorHandler'
import { validateEmail, validatePassword } from '@/utils/validation'

import BaseCard from '@/components/ui/card/BaseCard'

import BaseDialog from '@/components/ui/dialog/BaseDialog'

import PasswordResetForm from '@/components/forms/password-reset/PasswordResetForm'
import VerifyEmailInbox from '@/components/forms/verify-email/VerifyEmailInbox'
import UserAuthenticationForm from '@/components/forms/user-authentication/UserAuthenticationForm'

const RESET_MODE = 'reset'
const RESET_IDLE = { status: 'idle', error: '', sentTo: '' }
const VERIFY_MODE = 'verify'
const VERIFY_IDLE = {
	email: '',
	resent: false,
	cooldownEndsAt: null,
	isSending: false,
	isChecking: false,
	error: '',
}

// The welcome band opens sign-up, and the email-link page's expired reset opens the reset view
const initialMode = (param) =>
	param === API_DATABASE.AUTH_SIGNUP_MODE || param === RESET_MODE
		? param
		: API_DATABASE.AUTH_LOGIN_MODE

const Authentication = () => {
	const [email, setEmail] = useFormField('')
	const [password, setPassword] = useFormField('')

	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)

	const [mode, setMode] = useState(() =>
		initialMode(searchParams.get(AUTH_FORM_CONFIG.MODE_PARAM)),
	)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(false)

	// A visitor sent here from a trip is told why; the name is known when they came from the public list
	const tripId = matchPath(
		PATHS.TRAVELLER_DETAIL,
		searchParams.get('redirect') ?? '',
	)?.params.id
	const publicTrips = useSelector(selectPublicTrips)
	const tripNotice = tripId
		? AUTH_FORM_CONFIG.TRIP_NOTICE(
				publicTrips.find(({ id }) => id === tripId)?.firstName,
			)
		: undefined

	const titleRef = useRef(null)
	const hasSwitchedView = useRef(false)
	const [reset, setReset] = useState(RESET_IDLE)
	const [verify, setVerify] = useState(VERIFY_IDLE)

	// The heading takes focus when the card swaps views, so a screen reader hears the new one
	useEffect(() => {
		if (!hasSwitchedView.current) return
		titleRef.current?.focus()
	}, [mode])

	const validateEmailHandler = (value) => {
		const { isValid, message } = validateEmail(value)
		setEmail(value, isValid, message)
		return isValid
	}

	const validatePasswordHandler = (value) => {
		const { isValid, message } = validatePassword(value)
		setPassword(value, isValid, message)
		return isValid
	}

	// Typing never raises a new error; it only clears or updates one the field already shows
	const handleTyping = (field, setField, validate) => (e) => {
		const { value } = e.target
		if (field.isValid) {
			setField(value)
			return
		}
		validate(value)
	}

	const validateForm = () => {
		const trimmedEmail = email.value.trim()
		const trimmedPassword = password.value.trim()

		const emailValid = validateEmailHandler(trimmedEmail)
		const passwordValid = validatePasswordHandler(trimmedPassword)

		if (!emailValid) document.getElementById('email')?.focus()
		else if (!passwordValid) document.getElementById('password')?.focus()

		return {
			email: trimmedEmail,
			password: trimmedPassword,
			isValid: emailValid && passwordValid,
		}
	}

	const submitForm = async (e) => {
		e.preventDefault()
		const {
			email: trimmedEmail,
			password: trimmedPassword,
			isValid,
		} = validateForm()

		if (!isValid) return

		try {
			setIsLoading(true)

			const actionPayload = {
				mode,
				email: trimmedEmail,
				password: trimmedPassword,
			}

			const result = await dispatch(login(actionPayload))

			if (result.meta && result.meta.rejectedWithValue) {
				throw new Error(result.payload)
			}

			setPassword('')

			if (result.payload?.awaitingVerification) {
				setVerify({ ...VERIFY_IDLE, email: trimmedEmail })
				switchView(VERIFY_MODE)
				return
			}

			setEmail('')
			navigate(redirectTarget(PATHS.TRAVELLERS))
		} catch (error) {
			setError(handleApiError(error, ERROR_MESSAGES.LOGIN_FAILED))
		} finally {
			setIsLoading(false)
		}
	}

	const redirectTarget = (fallback) =>
		new URLSearchParams(location.search).get('redirect') || fallback

	// A new account's next step is its trip, unless it came here from a page it asked for
	const continueVerified = () => {
		navigate(redirectTarget(PATHS.REGISTER), { replace: true })
		dispatch(authActions.clearAwaitingVerification())
	}

	const checkVerified = async ({ quiet = false } = {}) => {
		if (!quiet) setVerify((v) => ({ ...v, isChecking: true, error: '' }))
		const result = await dispatch(refreshVerification())

		if (result.payload?.emailVerified) {
			continueVerified()
			return
		}
		if (quiet) return

		setVerify((v) => ({
			...v,
			isChecking: false,
			error: refreshVerification.rejected.match(result)
				? result.payload
				: VERIFY_EMAIL_CONFIG.NOT_YET(v.email),
		}))
	}

	const resendLink = async () => {
		setVerify((v) => ({ ...v, isSending: true, error: '' }))
		const result = await dispatch(resendVerification())

		setVerify((v) =>
			resendVerification.rejected.match(result)
				? { ...v, isSending: false, error: result.payload }
				: {
						...v,
						isSending: false,
						resent: true,
						cooldownEndsAt:
							Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
					},
		)
	}

	const startOver = async () => {
		const result = await dispatch(startAgain())

		if (startAgain.rejected.match(result)) {
			setVerify((v) => ({ ...v, error: result.payload }))
			return
		}
		setVerify(VERIFY_IDLE)
		switchView(API_DATABASE.AUTH_SIGNUP_MODE)
	}

	// Coming back from the mail app checks again, so the button is a fallback rather than the only way on
	useEffect(() => {
		if (mode !== VERIFY_MODE) return
		const onVisible = () => {
			if (document.visibilityState === 'visible') {
				checkVerified({ quiet: true })
			}
		}
		document.addEventListener('visibilitychange', onVisible)
		return () => document.removeEventListener('visibilitychange', onVisible)
	})

	const switchView = (nextMode) => {
		hasSwitchedView.current = true
		setMode(nextMode)
	}

	const switchAuthMode = () =>
		switchView(
			mode === API_DATABASE.AUTH_LOGIN_MODE
				? API_DATABASE.AUTH_SIGNUP_MODE
				: API_DATABASE.AUTH_LOGIN_MODE,
		)

	const openReset = () => {
		setReset(RESET_IDLE)
		switchView(RESET_MODE)
	}

	const closeReset = () => switchView(API_DATABASE.AUTH_LOGIN_MODE)

	const sendReset = async (address) => {
		setReset({ status: 'sending', error: '', sentTo: '' })
		const result = await dispatch(sendPasswordReset(address))

		if (sendPasswordReset.rejected.match(result)) {
			setReset({
				status: 'idle',
				error: handleApiError(
					result.payload,
					ERROR_MESSAGES.PASSWORD_RESET_FAILED,
				),
				sentTo: '',
			})
			return
		}

		setEmail(address)
		setReset({ status: 'sent', error: '', sentTo: address })
	}

	const handleError = () => setError(null)

	const pageTitle = {
		[API_DATABASE.AUTH_LOGIN_MODE]: AUTH_FORM_CONFIG.LOGIN_TITLE,
		[API_DATABASE.AUTH_SIGNUP_MODE]: AUTH_FORM_CONFIG.SIGNUP_TITLE,
		[RESET_MODE]: PASSWORD_RESET_CONFIG.TITLE,
		[VERIFY_MODE]: VERIFY_EMAIL_CONFIG.TITLE,
	}[mode]

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage"
			data-cy="main-container"
			data-cy-alt="authentication-main-container">
			<title>{`${pageTitle} · ${GLOBAL.SITE_NAME}`}</title>
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={handleError}
					data-cy="invalid-email-or-password-dialog">
					{error}
				</BaseDialog>
			)}
			<section>
				<BaseCard>
					{mode === VERIFY_MODE ? (
						<VerifyEmailInbox
							ref={titleRef}
							email={verify.email}
							resent={verify.resent}
							cooldownEndsAt={verify.cooldownEndsAt}
							isSending={verify.isSending}
							isChecking={verify.isChecking}
							error={verify.error}
							onResend={resendLink}
							onCheck={() => checkVerified()}
							onStartAgain={startOver}
						/>
					) : mode === RESET_MODE ? (
						<PasswordResetForm
							ref={titleRef}
							initialEmail={email.value.trim()}
							status={reset.status}
							error={reset.error}
							sentTo={reset.sentTo}
							onSubmit={sendReset}
							onBack={closeReset}
						/>
					) : (
						<UserAuthenticationForm
							ref={titleRef}
							email={email}
							password={password}
							mode={mode}
							onEmailChange={handleTyping(
								email,
								setEmail,
								validateEmailHandler,
							)}
							onEmailBlur={(e) =>
								validateEmailHandler(e.target.value.trim())
							}
							onPasswordChange={handleTyping(
								password,
								setPassword,
								validatePasswordHandler,
							)}
							onPasswordBlur={(e) =>
								validatePasswordHandler(e.target.value)
							}
							onSubmit={submitForm}
							onSwitchMode={switchAuthMode}
							onForgotPassword={openReset}
							isLoading={isLoading}
							notice={tripNotice}
						/>
					)}
				</BaseCard>
			</section>
		</main>
	)
}

export default Authentication
