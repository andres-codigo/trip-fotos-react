import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_DATABASE } from '@/constants/api';
import { API_ERROR_MESSAGE } from '@/constants/api-messages';
import { GLOBAL } from '@/constants/global';
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
	const [formIsValid, setFormIsValid] = useState(true);
	const [mode, setMode] = useState(API_DATABASE.API_AUTH_LOGIN_MODE);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(false);

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const validateEmail = (value) => {
		if (
			/^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,3}$/.test(
				value,
			)
		) {
			setEmail({ ...email, isValid: true, message: '' });
			setFormIsValid(true);
		} else {
			setEmail({
				...email,
				isValid: false,
				message: 'Please enter a valid email address.',
			});
			setFormIsValid(false);
		}
	};

	const validatePassword = (value) => {
		if (value.length < 8) {
			setPassword({
				...password,
				isValid: false,
				message: `Your password must be a minimum of 8 characters long! ${8 - value.length} characters left.`,
			});
			setFormIsValid(false);
		} else {
			setPassword({ ...password, isValid: true, message: '' });
			setFormIsValid(true);
		}
	};

	const validateForm = () => {
		setFormIsValid(true);
		if (email.value === '') validateEmail(email.value);
		if (password.value === '') validatePassword(password.value);
	};

	const submitForm = async (e) => {
		e.preventDefault();
		validateForm();

		if (!formIsValid) return;

		setIsLoading(true);

		const actionPayload = { email: email.value, password: password.value };

		try {
			if (mode === API_DATABASE.API_AUTH_LOGIN_MODE) {
				await dispatch({
					type: API_DATABASE.API_AUTH_LOGIN_MODE,
					payload: actionPayload,
				});
				await dispatch({
					type: 'travellers/loadTravellers',
					payload: { forceRefresh: true },
				});
			} else {
				await dispatch({
					type: API_DATABASE.API_AUTH_SIGNUP_MODE,
					payload: actionPayload,
				});
			}

			const redirectUrl =
				'/' +
				(new URLSearchParams(location.search).get('redirect') ||
					'trips');
			navigate(redirectUrl);
		} catch (err) {
			setError(err.message || API_ERROR_MESSAGE.FAILED_TO_AUTHENTICATE);
		}

		setIsLoading(false);
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
							onChange={(e) =>
								setEmail({ ...email, value: e.target.value })
							}
							onBlur={() => validateEmail(email.value)}
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
							onChange={(e) =>
								setPassword({
									...password,
									value: e.target.value,
								})
							}
							onBlur={() => validatePassword(password.value)}
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
