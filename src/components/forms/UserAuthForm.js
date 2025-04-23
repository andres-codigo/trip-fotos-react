import PropTypes from 'prop-types';

import { API_DATABASE } from '@/constants/api';

import BaseButton from '@/components/ui/button/BaseButton';

import userAuthStyles from './UserAuthForm.module.scss';

const UserAuthForm = ({
	email,
	password,
	mode,
	onEmailChange,
	onPasswordChange,
	onSubmit,
	onSwitchMode,
}) => (
	<form className={userAuthStyles.userAuthentication} onSubmit={onSubmit}>
		<div
			className={`${userAuthStyles.formControl} ${
				!email.isValid ? userAuthStyles.invalid : ''
			}`}>
			<label htmlFor="email">E-Mail</label>
			<input
				id="email"
				type="email"
				value={email.value}
				onChange={onEmailChange}
				onBlur={onEmailChange}
			/>
			{!email.isValid && <p>{email.message}</p>}
		</div>
		<div
			className={`${userAuthStyles.formControl} ${
				!password.isValid ? userAuthStyles.invalid : ''
			}`}>
			<label htmlFor="password">Password</label>
			<input
				id="password"
				type="password"
				value={password.value}
				onChange={onPasswordChange}
				onBlur={onPasswordChange}
			/>
			{!password.isValid && <p>{password.message}</p>}
		</div>
		<BaseButton>
			{mode === API_DATABASE.API_AUTH_LOGIN_MODE ? 'Login' : 'Sign-up'}
		</BaseButton>
		<BaseButton type="button" mode="flat" onClick={onSwitchMode}>
			{mode === API_DATABASE.API_AUTH_LOGIN_MODE ? 'Sign-up' : 'Login'}
		</BaseButton>
	</form>
);

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
	mode: PropTypes.oneOf(['login', 'signup']).isRequired,
	onEmailChange: PropTypes.func.isRequired,
	onPasswordChange: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onSwitchMode: PropTypes.func.isRequired,
};

export default UserAuthForm;
