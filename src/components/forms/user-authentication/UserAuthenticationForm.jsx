import PropTypes from 'prop-types'

import { API_DATABASE } from '@/constants/api'
import { ACCESSIBILITY } from '@/constants/ui'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'

import userAuthStyles from './UserAuthenticationForm.module.scss'

const UserAuthenticationForm = ({
	email,
	password,
	mode,
	onEmailChange,
	onPasswordChange,
	onSubmit,
	onSwitchMode,
	isLoading = false,
}) => {
	const EMAIL_ID = 'email'
	const PASSWORD_ID = 'password'

	const getInputProps = (field) => ({
		id: field === EMAIL_ID ? EMAIL_ID : PASSWORD_ID,
		label: field === EMAIL_ID ? 'E-Mail' : 'Password',
		type: field === EMAIL_ID ? EMAIL_ID : PASSWORD_ID,
		value: field === EMAIL_ID ? email.value : password.value,
		onChange: field === EMAIL_ID ? onEmailChange : onPasswordChange,
		onBlur: field === EMAIL_ID ? onEmailChange : onPasswordChange,
		isValid: field === EMAIL_ID ? email.isValid : password.isValid,
		message: field === EMAIL_ID ? email.message : password.message,
		disabled: isLoading,
		required: true,
		showRequiredMark: true,
		className: 'formControlInput',
		'data-cy': field === EMAIL_ID ? 'email-input' : 'password-input',
		'data-cy-error':
			field === EMAIL_ID
				? 'email-error-message'
				: 'password-error-message',
		'aria-describedby':
			!(field === EMAIL_ID ? email.isValid : password.isValid) &&
			(field === EMAIL_ID ? email.message : password.message)
				? field === EMAIL_ID
					? 'email-error'
					: 'password-error'
				: undefined,
	})

	const handleSignUpClick = (e) => {
		e.preventDefault()
		onSwitchMode(e)
	}

	return (
		<form
			className={userAuthStyles.userAuthentication}
			onSubmit={onSubmit}
			noValidate
			data-cy="user-authentication-form"
			aria-busy={isLoading}
			aria-labelledby="user-authentication-form-title">
			<h2
				id="user-authentication-form-title"
				className={userAuthStyles.userAuthenticationTitle}
				data-cy="user-authentication-form-title">
				{mode === API_DATABASE.AUTH_LOGIN_MODE ? (
					<>
						Login{' '}
						<span className={userAuthStyles.visuallyHidden}>
							Form
						</span>
					</>
				) : (
					<>
						Signup{' '}
						<span className={userAuthStyles.visuallyHidden}>
							Form
						</span>
					</>
				)}
			</h2>
			<div
				aria-live="polite"
				style={ACCESSIBILITY.ARIA_LIVE.POLITE.STYLE}>
				{isLoading ? ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE : ''}
			</div>
			<div
				className={`${userAuthStyles.formControl} ${
					!email.isValid ? userAuthStyles.invalidForm : ''
				}`}>
				<Input {...getInputProps(EMAIL_ID)} />
				{!email.isValid && email.message && (
					<span
						id="email-error"
						role="alert"
						className={userAuthStyles.visuallyHidden}>
						{email.message}
					</span>
				)}
			</div>
			<div
				className={`${userAuthStyles.formControl} ${
					!password.isValid ? userAuthStyles.invalidForm : ''
				}`}>
				<Input {...getInputProps(PASSWORD_ID)} />
				{!password.isValid && password.message && (
					<span
						id="password-error"
						role="alert"
						className={userAuthStyles.visuallyHidden}>
						{password.message}
					</span>
				)}
			</div>
			<div className={userAuthStyles.formActions}>
				<BaseButton
					id="login-button"
					type="submit"
					mode="flat"
					className={userAuthStyles.formSubmitButton}
					data-cy="login-submit-button"
					isDisabled={isLoading}>
					{mode === API_DATABASE.AUTH_LOGIN_MODE
						? 'Log in'
						: 'Sign up'}
				</BaseButton>
				<BaseButton
					id="login-signup-toggle-link"
					isLink
					onClick={handleSignUpClick}
					className={userAuthStyles.toggleLink}
					data-cy="login-signup-toggle-link"
					isDisabled={isLoading}>
					{mode === API_DATABASE.AUTH_LOGIN_MODE
						? 'Switch to Signup'
						: 'Switch to Login'}
				</BaseButton>
			</div>
		</form>
	)
}

UserAuthenticationForm.propTypes = {
	email: PropTypes.shape({
		value: PropTypes.string.isRequired,
		isValid: PropTypes.bool.isRequired,
		message: PropTypes.string,
	}),
	password: PropTypes.shape({
		value: PropTypes.string.isRequired,
		isValid: PropTypes.bool.isRequired,
		message: PropTypes.string,
	}),
	mode: PropTypes.oneOf([
		API_DATABASE.AUTH_LOGIN_MODE,
		API_DATABASE.AUTH_SIGNUP_MODE,
	]).isRequired,
	onEmailChange: PropTypes.func.isRequired,
	onPasswordChange: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onSwitchMode: PropTypes.func.isRequired,
	isLoading: PropTypes.bool,
}

export default UserAuthenticationForm
