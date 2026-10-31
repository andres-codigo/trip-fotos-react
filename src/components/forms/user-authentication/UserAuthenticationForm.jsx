import PropTypes from 'prop-types'

import { API_DATABASE } from '@/constants/api'
import { renderVisuallyHiddenError } from '@/utils/form/errorUtils'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

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
			className="m-4 p-4"
			onSubmit={onSubmit}
			noValidate
			data-cy="user-authentication-form"
			aria-busy={isLoading}
			aria-labelledby="user-authentication-form-title">
			<h1
				id="user-authentication-form-title"
				className="mt-0 mb-[0.83em] text-2xl"
				data-cy="user-authentication-form-title">
				{mode === API_DATABASE.AUTH_LOGIN_MODE ? (
					<>
						Login <span className="sr-only">Form</span>
					</>
				) : (
					<>
						Signup <span className="sr-only">Form</span>
					</>
				)}
			</h1>
			<LoadingAnnouncement isLoading={isLoading} />
			<div className="my-2">
				<Input {...getInputProps(EMAIL_ID)} />
				{renderVisuallyHiddenError(email, 'email-error', 'sr-only')}
			</div>
			<div className="my-2">
				<Input {...getInputProps(PASSWORD_ID)} />
				{renderVisuallyHiddenError(
					password,
					'password-error',
					'sr-only',
				)}
			</div>
			<div className="mt-5">
				<BaseButton
					id="login-button"
					type="submit"
					mode="flat"
					className="w-full lg:w-[6.4375rem]"
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
					className="w-full pt-5 text-center text-accent-foreground hover:text-secondary lg:w-auto lg:pt-0 lg:pl-2"
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
