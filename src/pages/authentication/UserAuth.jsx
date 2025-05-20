import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

import { API_DATABASE } from '@/constants/api'
import { GLOBAL } from '@/constants/global'
import { PATHS } from '@/constants/paths'

import { login } from '@/store/slices/authenticationSlice'

import useFormField from '@/components/forms/hooks/useFormField'

import { getFirebaseAuthErrorMessage } from '@/utils/getFirebaseAuthErrorMessage'
import { validateEmail, validatePassword } from '@/utils/validation'

import UserAuthForm from '@/components/forms/UserAuthForm'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseCard from '@/components/ui/card/BaseCard'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

const UserAuth = () => {
	const [email, setEmail] = useFormField('')
	const [password, setPassword] = useFormField('')

	const [mode, setMode] = useState(API_DATABASE.API_AUTH_LOGIN_MODE)
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
		const emailValid = await validateEmailHandler(email.value)
		const passwordValid = await validatePasswordHandler(password.value)
		return emailValid && passwordValid
	}

	const submitForm = async (e) => {
		e.preventDefault()
		const isFormValid = await validateForm()

		if (!isFormValid) return

		try {
			setIsLoading(true)

			const actionPayload = {
				mode: API_DATABASE.API_AUTH_LOGIN_MODE,
				email: email.value,
				password: password.value,
			}

			let result
			if (mode === API_DATABASE.API_AUTH_LOGIN_MODE) {
				result = await dispatch(login(actionPayload))
			} else {
				result = await dispatch({
					type: API_DATABASE.API_AUTH_SIGNUP_MODE,
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
				PATHS.TRIPS

			navigate(redirectUrl)
		} catch (error) {
			setError(error.message || getFirebaseAuthErrorMessage())
		} finally {
			setIsLoading(false)
		}
	}

	const switchAuthMode = () => {
		setMode((prevMode) =>
			prevMode === API_DATABASE.API_AUTH_LOGIN_MODE
				? API_DATABASE.API_AUTH_SIGNUP_MODE
				: API_DATABASE.API_AUTH_LOGIN_MODE,
		)
	}

	const handleError = () => setError(null)

	return (
		<section className="pageSection">
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={handleError}>
					<p>{error}</p>
				</BaseDialog>
			)}
			{isLoading && (
				<BaseDialog
					show={true}
					title="Authenticating"
					fixed>
					<p>Authenticating your details, one moment please...</p>
					<BaseSpinner />
				</BaseDialog>
			)}
			<BaseCard>
				<UserAuthForm
					email={email}
					password={password}
					mode={mode}
					onEmailChange={(e) => validateEmailHandler(e.target.value)}
					onPasswordChange={(e) =>
						validatePasswordHandler(e.target.value)
					}
					onSubmit={submitForm}
					onSwitchMode={switchAuthMode}
				/>
			</BaseCard>
		</section>
	)
}

export default UserAuth
