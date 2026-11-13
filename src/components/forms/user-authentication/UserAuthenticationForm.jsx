import { forwardRef } from 'react'
import PropTypes from 'prop-types'

import { API_DATABASE } from '@/constants/api'
import { AUTH_FORM_CONFIG } from '@/constants/auth'
import { renderVisuallyHiddenError } from '@/utils/form/errorUtils'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'
import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

const EMAIL_ID = 'email'
const PASSWORD_ID = 'password'

const switchLinkClasses =
	'inline-flex min-h-11 items-center text-accent-text underline underline-offset-4 hover:text-accent-hover'

const UserAuthenticationForm = forwardRef(
	(
		{
			email,
			password,
			mode,
			onEmailChange,
			onEmailBlur,
			onPasswordChange,
			onPasswordBlur,
			onSubmit,
			onSwitchMode,
			onForgotPassword,
			isLoading = false,
			notice,
		},
		titleRef,
	) => {
		const isLogin = mode === API_DATABASE.AUTH_LOGIN_MODE

		const handleSwitchClick = (e) => {
			e.preventDefault()
			onSwitchMode(e)
		}

		return (
			<form
				className="m-4 flex flex-col gap-4 p-4"
				onSubmit={onSubmit}
				noValidate
				data-cy="user-authentication-form"
				aria-busy={isLoading}
				aria-labelledby="user-authentication-form-title">
				<div className="flex flex-col gap-2">
					<h1
						ref={titleRef}
						tabIndex={-1}
						id="user-authentication-form-title"
						className="m-0 text-[1.5rem]"
						data-cy="user-authentication-form-title">
						{isLogin
							? AUTH_FORM_CONFIG.LOGIN_TITLE
							: AUTH_FORM_CONFIG.SIGNUP_TITLE}
					</h1>
					{notice && (
						<p
							className="m-0 rounded-md bg-surface-accent px-3.5 py-2.5"
							data-cy="user-authentication-form-notice">
							{notice}
						</p>
					)}
					<RequiredLegend />
				</div>
				<LoadingAnnouncement isLoading={isLoading} />
				<div>
					<Input
						id={EMAIL_ID}
						label={AUTH_FORM_CONFIG.EMAIL_LABEL}
						type="email"
						autoComplete="email"
						value={email.value}
						onChange={onEmailChange}
						onBlur={onEmailBlur}
						isValid={email.isValid}
						message={email.message}
						disabled={isLoading}
						required
						data-cy="email-input"
						data-cy-error="email-error-message"
					/>
					{renderVisuallyHiddenError(
						email,
						'email-error-hidden',
						'sr-only',
					)}
				</div>
				<div className="flex flex-col items-start gap-1">
					<div className="w-full">
						<Input
							id={PASSWORD_ID}
							label={AUTH_FORM_CONFIG.PASSWORD_LABEL}
							type="password"
							autoComplete={
								isLogin ? 'current-password' : 'new-password'
							}
							helpText={
								isLogin ? '' : AUTH_FORM_CONFIG.PASSWORD_HELP
							}
							value={password.value}
							onChange={onPasswordChange}
							onBlur={onPasswordBlur}
							isValid={password.isValid}
							message={password.message}
							disabled={isLoading}
							required
							data-cy="password-input"
							data-cy-error="password-error-message"
						/>
						{renderVisuallyHiddenError(
							password,
							'password-error-hidden',
							'sr-only',
						)}
					</div>
					{isLogin && (
						<BaseButton
							type="button"
							modeType="text"
							className={switchLinkClasses}
							onClick={onForgotPassword}
							isDisabled={isLoading}
							data-cy="forgot-password-link">
							{AUTH_FORM_CONFIG.FORGOT_PASSWORD}
						</BaseButton>
					)}
				</div>
				<BaseButton
					id="login-button"
					type="submit"
					className="self-start [@media(max-width:1024px)]:w-full"
					data-cy="login-submit-button"
					busyLabel={
						isLoading
							? isLogin
								? AUTH_FORM_CONFIG.LOGIN_BUSY
								: AUTH_FORM_CONFIG.SIGNUP_BUSY
							: ''
					}>
					{isLogin
						? AUTH_FORM_CONFIG.LOGIN_SUBMIT
						: AUTH_FORM_CONFIG.SIGNUP_SUBMIT}
				</BaseButton>
				<p
					className="m-0 text-text-muted"
					data-cy="login-signup-toggle">
					{isLogin
						? AUTH_FORM_CONFIG.TO_SIGNUP_PROMPT
						: AUTH_FORM_CONFIG.TO_LOGIN_PROMPT}{' '}
					<BaseButton
						type="button"
						modeType="text"
						id="login-signup-toggle-link"
						className={switchLinkClasses}
						onClick={handleSwitchClick}
						data-cy="login-signup-toggle-link"
						isDisabled={isLoading}>
						{isLogin
							? AUTH_FORM_CONFIG.TO_SIGNUP
							: AUTH_FORM_CONFIG.TO_LOGIN}
					</BaseButton>
				</p>
			</form>
		)
	},
)

UserAuthenticationForm.displayName = 'UserAuthenticationForm'

const fieldShape = PropTypes.shape({
	value: PropTypes.string.isRequired,
	isValid: PropTypes.bool.isRequired,
	message: PropTypes.string,
})

UserAuthenticationForm.propTypes = {
	email: fieldShape,
	password: fieldShape,
	mode: PropTypes.oneOf([
		API_DATABASE.AUTH_LOGIN_MODE,
		API_DATABASE.AUTH_SIGNUP_MODE,
	]).isRequired,
	onEmailChange: PropTypes.func.isRequired,
	onEmailBlur: PropTypes.func.isRequired,
	onPasswordChange: PropTypes.func.isRequired,
	onPasswordBlur: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onSwitchMode: PropTypes.func.isRequired,
	onForgotPassword: PropTypes.func.isRequired,
	isLoading: PropTypes.bool,
	notice: PropTypes.string,
}

export default UserAuthenticationForm
