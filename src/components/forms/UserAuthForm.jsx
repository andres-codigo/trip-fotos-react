import PropTypes from 'prop-types'

import { API_DATABASE } from '@/constants/api'
import { ACCESSIBILITY } from '@/constants/accessibility'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'

import userAuthStyles from './UserAuthForm.module.scss'

const UserAuthForm = ({
	email,
	password,
	mode,
	onEmailChange,
	onPasswordChange,
	onSubmit,
	onSwitchMode,
	isLoading = false,
}) => {
	const getInputProps = (field) => ({
		id: field === 'email' ? 'email' : 'password',
		label: field === 'email' ? 'E-Mail' : 'Password',
		type: field === 'email' ? 'email' : 'password',
		value: field === 'email' ? email.value : password.value,
		onChange: field === 'email' ? onEmailChange : onPasswordChange,
		onBlur: field === 'email' ? onEmailChange : onPasswordChange,
		isValid: field === 'email' ? email.isValid : password.isValid,
		message: field === 'email' ? email.message : password.message,
		disabled: isLoading,
		required: true,
		showRequiredMark: true,
		className: 'formControlInput ',
		'data-cy': field === 'email' ? 'email-input' : 'password-input',
		'data-cy-error':
			field === 'email'
				? 'email-error-message'
				: 'password-error-message',
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
				{mode === API_DATABASE.API_AUTH_LOGIN_MODE ? (
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
				<Input {...getInputProps('email')} />
				{!email.isValid && email.message && (
					<span
						id="email-error-message"
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
				<Input {...getInputProps('password')} />
				{!password.isValid && password.message && (
					<span
						id="password-error-message"
						role="alert"
						className={userAuthStyles.visuallyHidden}>
						{password.message}
					</span>
				)}
			</div>
			<BaseButton
				id="login-button"
				type="submit"
				mode="flat"
				data-cy="login-submit-button"
				isDisabled={isLoading}>
				{mode === API_DATABASE.API_AUTH_LOGIN_MODE
					? 'Log in'
					: 'Sign up'}
			</BaseButton>
			<BaseButton
				id="login-signup-toggle-link"
				isLink
				onClick={handleSignUpClick}
				data-cy="login-signup-toggle-link"
				isDisabled={isLoading}>
				{mode === API_DATABASE.API_AUTH_LOGIN_MODE
					? 'Switch to Signup'
					: 'Switch to Login'}
			</BaseButton>
		</form>
	)
}

UserAuthForm.propTypes = {
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
		API_DATABASE.API_AUTH_LOGIN_MODE,
		API_DATABASE.API_AUTH_SIGNUP_MODE,
	]).isRequired,
	onEmailChange: PropTypes.func.isRequired,
	onPasswordChange: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onSwitchMode: PropTypes.func.isRequired,
	isLoading: PropTypes.bool,
}

export default UserAuthForm
