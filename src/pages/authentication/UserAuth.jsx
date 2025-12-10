import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

import { API_DATABASE } from '@/constants/api'
import { GLOBAL } from '@/constants/ui'
import { PATHS } from '@/constants/ui'

import { login } from '@/store/slices/authenticationSlice'

import useFormField from '@/components/forms/user-auth/hooks/useFormField'

import { getFirebaseAuthErrorMessage } from '@/utils/getFirebaseAuthErrorMessage'
import { validateEmail, validatePassword } from '@/utils/validation'

import BaseCard from '@/components/ui/card/BaseCard'

import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import UserAuthForm from '@/components/forms/user-auth/UserAuthForm'

const UserAuth = () => {
	const [email, setEmail] = useFormField('')
	const [password, setPassword] = useFormField('')

	const [mode, setMode] = useState(API_DATABASE.AUTH_LOGIN_MODE)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(false)

	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation()

	const validateEmailHandler = async (value) => {
		const { isValid, message } = validateEmail(value)
		setEmail(value, isValid, message)
		return isValid
	}

	const validatePasswordHandler = async (value) => {
		const { isValid, message } = validatePassword(value)
		setPassword(value, isValid, message)
		return isValid
	}

	const validateForm = async () => {
		const trimmedEmail = email.value.trim()
		const trimmedPassword = password.value.trim()

		const emailValid = await validateEmailHandler(trimmedEmail)
		const passwordValid = await validatePasswordHandler(trimmedPassword)

		if (!emailValid || !passwordValid)
			return {
				email: trimmedEmail,
				password: trimmedPassword,
				isValid: false,
			}

		return { email: trimmedEmail, password: trimmedPassword, isValid: true }
	}

	const submitForm = async (e) => {
		e.preventDefault()
		const {
			email: trimmedEmail,
			password: trimmedPassword,
			isValid,
		} = await validateForm()

		if (!isValid) return

		try {
			setIsLoading(true)

			const actionPayload = {
				mode: API_DATABASE.AUTH_LOGIN_MODE,
				email: trimmedEmail,
				password: trimmedPassword,
			}

			let result
			if (mode === API_DATABASE.AUTH_LOGIN_MODE) {
				result = await dispatch(login(actionPayload))
			} else {
				result = await dispatch({
					type: API_DATABASE.AUTH_SIGNUP_MODE,
					payload: actionPayload,
				})
			}

			if (result.meta && result.meta.rejectedWithValue) {
				setError(result.meta.rejectedWithValue)

				let errorMessage
				errorMessage = getFirebaseAuthErrorMessage(result.payload)

				throw new Error(errorMessage || getFirebaseAuthErrorMessage())
			}

			setEmail('')
			setPassword('')

			const redirectUrl =
				new URLSearchParams(location.search).get('redirect') ||
				PATHS.TRAVELLERS

			navigate(redirectUrl)
		} catch (error) {
			setError(error.message || getFirebaseAuthErrorMessage())
		} finally {
			setIsLoading(false)
		}
	}

	const switchAuthMode = () => {
		setMode((prevMode) =>
			prevMode === API_DATABASE.AUTH_LOGIN_MODE
				? API_DATABASE.AUTH_SIGNUP_MODE
				: API_DATABASE.AUTH_LOGIN_MODE,
		)
	}

	const handleError = () => setError(null)

	return (
		<main
			className="mainContainer authenticationContainer"
			data-cy="main-container"
			data-cy-alt="authentication-main-container">
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
			{isLoading && (
				<BaseDialog
					show={true}
					title="Authenticating"
					fixed
					data-cy="authenticating-dialog">
					Authenticating your details, one moment please...
					<BaseSpinner />
				</BaseDialog>
			)}
			<section>
				<BaseCard>
					<UserAuthForm
						email={email}
						password={password}
						mode={mode}
						onEmailChange={(e) =>
							validateEmailHandler(e.target.value)
						}
						onPasswordChange={(e) =>
							validatePasswordHandler(e.target.value)
						}
						onSubmit={submitForm}
						onSwitchMode={switchAuthMode}
						isLoading={isLoading}
					/>
				</BaseCard>
			</section>
		</main>
	)
}

export default UserAuth
