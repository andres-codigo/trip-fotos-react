import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import { login } from '../store/slices/authenticationSlice';

import { API_DATABASE } from '@/constants/api';
import { API_ERROR_MESSAGE } from '@/constants/api-messages';
import { GLOBAL } from '@/constants/global';
import { PATHS } from '@/constants/paths';

import BaseDialog from '@/components/ui/dialog/BaseDialog';
import BaseCard from '@/components/ui/card/BaseCard';
import BaseButton from '@/components/ui/button/BaseButton';
import BaseSpinner from '@/components/ui/spinner/BaseSpinner';

import userAuthStyles from './UserAuth.module.scss';

const UserAuth = () => {
	const [email, setEmail] = useState({
		value: '',
		isValid: true,
		message: '',
	});
	const [password, setPassword] = useState({
		value: '',
		isValid: true,
		message: '',
	});

	const [mode, setMode] = useState(API_DATABASE.API_AUTH_LOGIN_MODE);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(false);

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const validateEmail = async (value) => {
		const isValid =
			/^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,6}$/.test(
				value,
			);

		if (isValid) {
			setEmail((prev) => ({ ...prev, isValid: true, message: '' }));
			return true;
		} else {
			setEmail((prev) => ({
				...prev,
				isValid: false,
				message: 'Please enter a valid email address.',
			}));
			return false;
		}
	};

	const validatePassword = async (value) => {
		let difference = 6 - value.length;

		if (value.length < 6) {
			setPassword((prev) => ({
				...prev,
				isValid: false,
				message: `Your password must be a minimum of 6 characters long! ${difference} characters left.`,
			}));
			return false;
		} else {
			setPassword((prev) => ({
				...prev,
				isValid: true,
				message: '',
			}));
			return true;
		}
	};

	const validateForm = async () => {
		const emailValid = await validateEmail(email.value);
		const passwordValid = await validatePassword(password.value);
		return emailValid && passwordValid;
	};

	const submitForm = async (e) => {
		e.preventDefault();
		const isFormValid = await validateForm();

		if (!isFormValid) return;

		try {
			setIsLoading(true);

			const actionPayload = {
				mode: API_DATABASE.API_AUTH_LOGIN_MODE,
				email: email.value,
				password: password.value,
			};

			if (mode === API_DATABASE.API_AUTH_LOGIN_MODE) {
				await dispatch(login(actionPayload));

				setEmail({ value: '', isValid: true, message: '' });
				setPassword({ value: '', isValid: true, message: '' });
			} else {
				await dispatch({
					type: API_DATABASE.API_AUTH_SIGNUP_MODE,
					payload: actionPayload,
				});

				setEmail({ value: '', isValid: true, message: '' });
				setPassword({ value: '', isValid: true, message: '' });
			}

			const redirectUrl =
				new URLSearchParams(location.search).get('redirect') ||
				PATHS.TRIPS;

			navigate(redirectUrl);
		} catch (err) {
			setError(err.message || API_ERROR_MESSAGE.FAILED_TO_AUTHENTICATE);
		} finally {
			setIsLoading(false);
		}
	};

	const switchAuthMode = () => {
		setMode((prevMode) =>
			prevMode === API_DATABASE.API_AUTH_LOGIN_MODE
				? API_DATABASE.API_AUTH_SIGNUP_MODE
				: API_DATABASE.API_AUTH_LOGIN_MODE,
		);
	};

	const handleError = () => setError(null);

	return (
		<section className={userAuthStyles.userAuthenticationContainer}>
			<BaseDialog
				show={!!error}
				isError={!!error}
				title={GLOBAL.ERROR_DIALOG_TITLE}
				onClose={handleError}>
				<p>{error}</p>
			</BaseDialog>
			<BaseDialog show={isLoading} title="Authenticating" fixed>
				<p>Authenticating your details, one moment please...</p>
				<BaseSpinner />
			</BaseDialog>
			<BaseCard>
				<form
					className={userAuthStyles.userAuthentication}
					onSubmit={submitForm}>
					<div
						className={`${userAuthStyles.formControl} ${
							!email.isValid ? userAuthStyles.invalid : ''
						}`}>
						<label htmlFor="email">{email.label || 'E-Mail'}</label>
						<input
							id="email"
							type="email"
							value={email.value}
							onChange={async (e) => {
								const value = e.target.value;

								setEmail((prev) => ({ ...prev, value }));
								await validateEmail(value);
							}}
							onBlur={async () =>
								await validateEmail(email.value)
							}
						/>
						{!email.isValid && <p>{email.message}</p>}
					</div>
					<div
						className={`${userAuthStyles.formControl} ${
							!password.isValid ? userAuthStyles.invalid : ''
						}`}>
						<label htmlFor="password">
							{password.label || 'Password'}
						</label>
						<input
							id="password"
							type="password"
							value={password.value}
							onChange={async (e) => {
								const value = e.target.value;

								setPassword((prev) => ({ ...prev, value }));
								await validatePassword(e.target.value);
							}}
							onBlur={async () =>
								await validatePassword(password.value)
							}
						/>
						{!password.isValid && <p>{password.message}</p>}
					</div>
					<BaseButton>
						{mode === API_DATABASE.API_AUTH_LOGIN_MODE
							? 'Login'
							: 'Sign-up'}
					</BaseButton>
					{/* Uncomment if switching auth modes is needed */}
					<BaseButton
						type="button"
						mode="flat"
						onClick={switchAuthMode}>
						{mode === API_DATABASE.API_AUTH_LOGIN_MODE
							? 'Sign-up'
							: 'Login'}
					</BaseButton>
				</form>
			</BaseCard>
		</section>
	);
};

export default UserAuth;
