import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

import {
	ACTION_CODE_ERRORS,
	AUTH_ACTION_CONFIG,
	AUTH_ACTION_MODES,
	AUTH_FORM_CONFIG,
} from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { AUTH_ACTION_PAGE } from '@/constants/test'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import {
	applyEmailChange,
	applyEmailVerification,
	checkPasswordResetCode,
	confirmPasswordReset,
	resendVerification,
	selectIsAuthenticated,
	selectUserName,
} from '@/store/slices/authenticationSlice'
import {
	selectIsTraveller,
	selectIsTravellerKnown,
} from '@/store/slices/travellersSlice'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import InlineAlert from '@/components/ui/inline-alert/InlineAlert'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import NewPasswordForm from '@/components/forms/new-password/NewPasswordForm'

const VIEWS = Object.freeze({
	LOADING: 'loading',
	VERIFIED: 'verified',
	ALREADY: 'already',
	EXPIRED: 'expired',
	INVALID: 'invalid',
	NETWORK: 'network',
	FORM: 'form',
	DONE: 'done',
	RESET_EXPIRED: 'resetExpired',
	EMAIL_CHANGED: 'emailChanged',
	EMAIL_RECOVERED: 'emailRecovered',
})

const EMAIL_CHANGE_VIEWS = Object.freeze({
	[AUTH_ACTION_MODES.VERIFY_AND_CHANGE_EMAIL]: VIEWS.EMAIL_CHANGED,
	[AUTH_ACTION_MODES.RECOVER_EMAIL]: VIEWS.EMAIL_RECOVERED,
})

const STEPS = Object.freeze({ CHECK: 'check', CONFIRM: 'confirm' })

const RESEND_IDLE = { status: 'idle', error: '', email: '' }

const viewClasses = 'm-4 flex flex-col gap-4 p-4'
const titleClasses = 'm-0 text-[1.5rem]'
const buttonClasses = 'self-start [@media(max-width:1024px)]:w-full'

const Tick = () => (
	<svg
		aria-hidden="true"
		width="28"
		height="28"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="flex-none text-success"
		data-cy={AUTH_ACTION_PAGE.TICK}>
		<circle
			cx="12"
			cy="12"
			r="10"
		/>
		<path d="m8 12 3 3 5-6" />
	</svg>
)

const LinkButton = ({ to, label, dataCy, modeType = 'primary' }) => (
	<BaseButton
		isLink
		to={to}
		modeType={modeType}
		className={buttonClasses}
		data-cy={dataCy}>
		{label}
	</BaseButton>
)

LinkButton.propTypes = {
	to: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	dataCy: PropTypes.string,
	modeType: PropTypes.oneOf(['primary', 'outline']),
}

const logInButton = (
	<LinkButton
		to={PATHS.AUTHENTICATION}
		label={AUTH_ACTION_CONFIG.LOG_IN}
		dataCy={AUTH_ACTION_PAGE.LOG_IN}
	/>
)

const travellersButton = (modeType) => (
	<LinkButton
		to={PATHS.TRAVELLERS}
		label={AUTH_ACTION_CONFIG.GO_TO_TRAVELLERS}
		modeType={modeType}
	/>
)

const resetPasswordButton = (modeType) => (
	<LinkButton
		to={`${PATHS.AUTHENTICATION}?${AUTH_FORM_CONFIG.MODE_PARAM}=reset`}
		label={AUTH_ACTION_CONFIG.RESET_PASSWORD}
		dataCy={AUTH_ACTION_PAGE.RESET_PASSWORD}
		modeType={modeType}
	/>
)

const withEmail = (prefix, email, suffix) => (
	<>
		{prefix}{' '}
		<strong
			className="font-medium wrap-anywhere"
			data-cy={AUTH_ACTION_PAGE.EMAIL}>
			{email}
		</strong>
		{suffix}
	</>
)

const errorAlert = (message) => (
	<InlineAlert data-cy={AUTH_ACTION_PAGE.ALERT}>{message}</InlineAlert>
)

const verifyFailureView = (reason) =>
	({
		[ACTION_CODE_ERRORS.EXPIRED]: VIEWS.EXPIRED,
		[ACTION_CODE_ERRORS.NETWORK]: VIEWS.NETWORK,
	})[reason] ?? VIEWS.INVALID

const AuthAction = () => {
	const dispatch = useDispatch()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const mode = searchParams.get('mode')
	const code = searchParams.get('oobCode')
	const isKnownLink =
		Boolean(code) && Object.values(AUTH_ACTION_MODES).includes(mode)

	const isSignedIn = useSelector(selectIsAuthenticated)
	const userName = useSelector(selectUserName)
	const isTravellerKnown = useSelector(selectIsTravellerKnown)
	const isTraveller = useSelector(selectIsTraveller)
	const firstName = (userName ?? '').trim().split(/\s+/)[0]

	const [view, setView] = useState({
		status: isKnownLink ? VIEWS.LOADING : VIEWS.INVALID,
		signedIn: false,
		email: '',
		step: STEPS.CHECK,
	})
	const [resend, setResend] = useState(RESEND_IDLE)
	const [isRetrying, setIsRetrying] = useState(false)
	const [focusKey, setFocusKey] = useState(0)

	const titleRef = useRef(null)
	// StrictMode runs effects twice, and a one-time code applied twice would fail the second time
	const hasChecked = useRef(false)
	const lastPassword = useRef('')

	useEffect(() => {
		if (focusKey) titleRef.current?.focus()
	}, [focusKey])

	const show = useCallback((next) => {
		setView((current) => ({ ...current, ...next }))
		setFocusKey((key) => key + 1)
	}, [])

	const checkLink = useCallback(async () => {
		if (mode === AUTH_ACTION_MODES.VERIFY_EMAIL) {
			const result = await dispatch(applyEmailVerification(code))
			if (applyEmailVerification.fulfilled.match(result)) {
				const { signedIn, alreadyVerified } = result.payload
				show({
					status: alreadyVerified ? VIEWS.ALREADY : VIEWS.VERIFIED,
					signedIn,
				})
				return
			}
			show({ status: verifyFailureView(result.payload) })
			return
		}

		if (EMAIL_CHANGE_VIEWS[mode]) {
			const result = await dispatch(applyEmailChange(code))
			if (applyEmailChange.fulfilled.match(result)) {
				show({
					status: EMAIL_CHANGE_VIEWS[mode],
					email: result.payload,
				})
				return
			}
			// An expired change link has no new link to send, so it reads as not valid
			show(
				result.payload === ACTION_CODE_ERRORS.NETWORK
					? { status: VIEWS.NETWORK, step: STEPS.CHECK }
					: { status: VIEWS.INVALID },
			)
			return
		}

		const result = await dispatch(checkPasswordResetCode(code))
		if (checkPasswordResetCode.fulfilled.match(result)) {
			// The form focuses its own field, so the heading keeps still
			setView((current) => ({
				...current,
				status: VIEWS.FORM,
				email: result.payload,
			}))
			return
		}
		show(
			result.payload === ACTION_CODE_ERRORS.NETWORK
				? { status: VIEWS.NETWORK, step: STEPS.CHECK }
				: { status: VIEWS.RESET_EXPIRED },
		)
	}, [dispatch, mode, code, show])

	useEffect(() => {
		if (!isKnownLink || hasChecked.current) return
		hasChecked.current = true
		checkLink()
	}, [isKnownLink, checkLink])

	const savePassword = async (password) => {
		lastPassword.current = password
		const result = await dispatch(confirmPasswordReset({ code, password }))
		if (confirmPasswordReset.fulfilled.match(result)) {
			show({ status: VIEWS.DONE })
			return ''
		}

		const reason = result.payload
		if (reason === ACTION_CODE_ERRORS.WEAK_PASSWORD) {
			if (view.status !== VIEWS.FORM) show({ status: VIEWS.FORM })
			return VALIDATION_MESSAGES.PASSWORD_TOO_SHORT
		}
		show(
			reason === ACTION_CODE_ERRORS.NETWORK
				? { status: VIEWS.NETWORK, step: STEPS.CONFIRM }
				: { status: VIEWS.RESET_EXPIRED },
		)
		return ''
	}

	const tryAgain = async () => {
		if (view.step === STEPS.CONFIRM) {
			setIsRetrying(true)
			await savePassword(lastPassword.current)
			setIsRetrying(false)
			return
		}
		setView((current) => ({ ...current, status: VIEWS.LOADING }))
		checkLink()
	}

	const sendNewLink = async () => {
		setResend((current) => ({ ...current, status: 'sending', error: '' }))
		const result = await dispatch(resendVerification())
		if (resendVerification.fulfilled.match(result)) {
			setResend((current) => ({
				...current,
				status: 'sent',
				email: result.payload,
			}))
			setFocusKey((key) => key + 1)
			return
		}
		setResend((current) => ({
			...current,
			status: 'idle',
			error: result.payload || ERROR_MESSAGES.VERIFICATION_EMAIL_FAILED,
		}))
	}

	const verifiedText = () => {
		if (!view.signedIn) return AUTH_ACTION_CONFIG.VERIFIED_SIGNED_OUT_TEXT
		return isTravellerKnown && isTraveller
			? AUTH_ACTION_CONFIG.VERIFIED_TRAVELLER_TEXT(firstName)
			: AUTH_ACTION_CONFIG.VERIFIED_TEXT(firstName)
	}

	const verifiedAction = () => {
		if (!view.signedIn) return logInButton
		return isTravellerKnown && isTraveller ? (
			travellersButton()
		) : (
			<LinkButton
				to={PATHS.REGISTER}
				label={AUTH_ACTION_CONFIG.REGISTER}
			/>
		)
	}

	const expiredBody = () => {
		if (!isSignedIn) {
			return {
				text: AUTH_ACTION_CONFIG.EXPIRED_SIGNED_OUT_TEXT,
				actions: logInButton,
			}
		}
		if (resend.status === 'sent') {
			return {
				extra: (
					<div
						role="status"
						className="rounded-md border border-solid border-success bg-surface p-3"
						data-cy={AUTH_ACTION_PAGE.EXPIRED_SENT}>
						{AUTH_ACTION_CONFIG.EXPIRED_SENT_PREFIX}{' '}
						<strong className="font-medium wrap-anywhere">
							{resend.email}
						</strong>
						.
					</div>
				),
				actions: travellersButton('outline'),
			}
		}
		return {
			extra: resend.error && errorAlert(resend.error),
			text: AUTH_ACTION_CONFIG.EXPIRED_TEXT,
			actions: (
				<BaseButton
					type="button"
					modeType="primary"
					className={buttonClasses}
					onClick={sendNewLink}
					busyLabel={
						resend.status === 'sending'
							? AUTH_ACTION_CONFIG.SENDING
							: ''
					}
					data-cy={AUTH_ACTION_PAGE.SEND_NEW_LINK}>
					{AUTH_ACTION_CONFIG.SEND_NEW_LINK}
				</BaseButton>
			),
		}
	}

	const content = () => {
		switch (view.status) {
			case VIEWS.VERIFIED:
				return {
					tick: true,
					title: AUTH_ACTION_CONFIG.VERIFIED_TITLE,
					text: verifiedText(),
					actions: verifiedAction(),
				}
			case VIEWS.ALREADY:
				return {
					title: AUTH_ACTION_CONFIG.ALREADY_TITLE,
					text: AUTH_ACTION_CONFIG.ALREADY_TEXT,
					actions: travellersButton(),
				}
			case VIEWS.EXPIRED:
				return {
					title: AUTH_ACTION_CONFIG.EXPIRED_TITLE,
					...expiredBody(),
				}
			case VIEWS.NETWORK:
				return {
					title: AUTH_ACTION_CONFIG.NETWORK_TITLE,
					extra: errorAlert(AUTH_ACTION_CONFIG.NETWORK_TEXT),
					actions: (
						<BaseButton
							type="button"
							modeType="primary"
							className={buttonClasses}
							onClick={tryAgain}
							busyLabel={
								isRetrying ? AUTH_ACTION_CONFIG.SAVING : ''
							}
							data-cy={AUTH_ACTION_PAGE.TRY_AGAIN}>
							{AUTH_ACTION_CONFIG.TRY_AGAIN}
						</BaseButton>
					),
				}
			case VIEWS.DONE:
				return {
					tick: true,
					title: AUTH_ACTION_CONFIG.RESET_DONE_TITLE,
					text: AUTH_ACTION_CONFIG.RESET_DONE_TEXT,
					actions: logInButton,
				}
			case VIEWS.RESET_EXPIRED:
				return {
					title: AUTH_ACTION_CONFIG.RESET_EXPIRED_TITLE,
					text: AUTH_ACTION_CONFIG.RESET_EXPIRED_TEXT,
					actions: resetPasswordButton(),
				}
			case VIEWS.EMAIL_CHANGED:
				return {
					tick: true,
					title: AUTH_ACTION_CONFIG.EMAIL_CHANGED_TITLE,
					text: withEmail(
						AUTH_ACTION_CONFIG.EMAIL_CHANGED_PREFIX,
						view.email,
						AUTH_ACTION_CONFIG.EMAIL_CHANGED_SUFFIX,
					),
					actions: logInButton,
				}
			case VIEWS.EMAIL_RECOVERED:
				return {
					title: AUTH_ACTION_CONFIG.EMAIL_RECOVERED_TITLE,
					text: withEmail(
						AUTH_ACTION_CONFIG.EMAIL_RECOVERED_PREFIX,
						view.email,
						AUTH_ACTION_CONFIG.EMAIL_RECOVERED_SUFFIX,
					),
					actions: (
						<div className="flex flex-col-reverse gap-3 lg:flex-row">
							<LinkButton
								to={PATHS.AUTHENTICATION}
								label={AUTH_ACTION_CONFIG.LOG_IN}
								dataCy={AUTH_ACTION_PAGE.LOG_IN}
								modeType="outline"
							/>
							{resetPasswordButton()}
						</div>
					),
				}
			default:
				return {
					title: AUTH_ACTION_CONFIG.INVALID_TITLE,
					text: AUTH_ACTION_CONFIG.INVALID_TEXT,
					actions: logInButton,
				}
		}
	}

	const renderView = () => {
		if (view.status === VIEWS.LOADING) {
			return (
				<div
					className={viewClasses}
					aria-busy="true"
					data-cy={AUTH_ACTION_PAGE.VIEW}>
					<h1
						className="sr-only"
						data-cy={AUTH_ACTION_PAGE.TITLE}>
						{AUTH_ACTION_CONFIG.NETWORK_TITLE}
					</h1>
					<BaseSpinner
						label={AUTH_ACTION_CONFIG.LOADING}
						className="py-8"
					/>
				</div>
			)
		}

		if (view.status === VIEWS.FORM) {
			return (
				<NewPasswordForm
					email={view.email}
					onSubmit={savePassword}
				/>
			)
		}

		const { tick, title, text, extra, actions } = content()
		return (
			<div
				className={viewClasses}
				data-cy={AUTH_ACTION_PAGE.VIEW}>
				{tick && <Tick />}
				<h1
					ref={titleRef}
					tabIndex={-1}
					className={titleClasses}
					data-cy={AUTH_ACTION_PAGE.TITLE}>
					{title}
				</h1>
				{extra}
				{text && <p className="m-0">{text}</p>}
				{actions}
			</div>
		)
	}

	const pageTitle =
		{
			[VIEWS.LOADING]: AUTH_ACTION_CONFIG.NETWORK_TITLE,
			[VIEWS.FORM]: AUTH_ACTION_CONFIG.RESET_TITLE,
		}[view.status] ?? content().title

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage"
			data-cy="main-container">
			<title>{`${pageTitle} · ${GLOBAL.SITE_NAME}`}</title>
			<section>
				<BaseCard>{renderView()}</BaseCard>
			</section>
		</main>
	)
}

export default AuthAction
