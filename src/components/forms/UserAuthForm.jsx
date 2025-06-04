import { useState } from 'react'
import PropTypes from 'prop-types'

import { API_DATABASE } from '@/constants/api'

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
	isLoading,
}) => {
	const [requireInputs, setRequireInputs] = useState(true)

	const handleLoginClick = () => {
		setRequireInputs(true)
	}

	const handleSignUpClick = (e) => {
		setRequireInputs(false)
		onSwitchMode(e)

		e.preventDefault()
	}

	return (
		<form
			className={userAuthStyles.userAuthentication}
			onSubmit={onSubmit}
			noValidate>
			<div
				className={`${userAuthStyles.formControl} ${
					!email.isValid ? userAuthStyles.invalidForm : ''
				}`}>
				<Input
					id="email"
					label="E-Mail"
					type="email"
					value={email.value}
					onChange={onEmailChange}
					onBlur={onEmailChange}
					isValid={email.isValid}
					message={email.message}
					disabled={isLoading}
					required={requireInputs}
					showRequiredMark={true}
					dataCypress="email-input"
					dataCypressError="email-error-message"
				/>
			</div>
			<div
				className={`${userAuthStyles.formControl} ${
					!password.isValid ? userAuthStyles.invalidForm : ''
				}`}>
				<Input
					id="password"
					label="Password"
					type="password"
					value={password.value}
					onChange={onPasswordChange}
					onBlur={onPasswordChange}
					isValid={password.isValid}
					message={password.message}
					disabled={isLoading}
					required={requireInputs}
					showRequiredMark={true}
					dataCypress="password-input"
					dataCypressError="password-error-message"
				/>
			</div>
			<BaseButton
				id="login-button"
				type="submit"
				mode="flat"
				dataCypress="login-submit-button"
				isDisabled={isLoading}
				onClick={handleLoginClick}>
				{mode === API_DATABASE.API_AUTH_LOGIN_MODE
					? 'Log in'
					: 'Sign up'}
			</BaseButton>
			<BaseButton
				id="login-signup-toggle-link"
				isLink
				onClick={handleSignUpClick}
				dataCypress="login-signup-toggle-link"
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
	mode: PropTypes.oneOf([API_DATABASE.API_AUTH_LOGIN_MODE, API_DATABASE])
		.isRequired,
	onEmailChange: PropTypes.func.isRequired,
	onPasswordChange: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onSwitchMode: PropTypes.func.isRequired,
	isLoading: PropTypes.bool,
}

export default UserAuthForm
