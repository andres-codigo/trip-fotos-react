import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { AuthenticationActionTypes } from '../../constants/action-types';
import { APIConstants } from '../../constants/api';

let timer;

export const selectAuthenticationToken = (state) => state.authentication.token;

export const login = createAsyncThunk(
	AuthenticationActionTypes.LOGIN,
	async (payload, { dispatch, rejectWithValue }) => {
		const url =
			payload.mode === APIConstants.API_AUTH_SIGNUP_MODE
				? `${APIConstants.API_URL}signUp?key=${APIConstants.API_KEY}`
				: `${APIConstants.API_URL}signInWithPassword?key=${APIConstants.API_KEY}`;

		try {
			const response = await fetch(url, {
				method: APIConstants.POST,
				body: JSON.stringify({
					email: payload.email,
					password: payload.password,
					returnSecureToken: true,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error.message || 'Failed to authenticate.',
				);
			}

			const expiresIn = +data.expiresIn * 1000;
			const expirationDate = new Date().getTime() + expiresIn;

			localStorage.setItem('token', data.idToken);
			localStorage.setItem('userId', data.localId);
			localStorage.setItem('userName', data.displayName || '');
			localStorage.setItem('userEmail', data.email);
			localStorage.setItem('tokenExpiration', expirationDate);

			timer = setTimeout(() => {
				dispatch(autoLogout());
			}, expiresIn);

			return {
				token: data.idToken,
				userId: data.localId,
				userName: data.displayName || '',
				userEmail: data.email,
			};
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

export const tryLogin = createAsyncThunk(
	AuthenticationActionTypes.TRY_LOGIN,
	async (_, { dispatch }) => {
		const token = localStorage.getItem('token');
		const userId = localStorage.getItem('userId');
		const userName = localStorage.getItem('userName');
		const userEmail = localStorage.getItem('userEmail');
		const tokenExpiration = localStorage.getItem('tokenExpiration');

		const expiresIn = +tokenExpiration - new Date().getTime();

		if (expiresIn < 0) {
			dispatch(autoLogout());
			return null;
		}

		timer = setTimeout(() => {
			dispatch(autoLogout());
		}, expiresIn);

		if (token && userId) {
			return { token, userId, userName, userEmail };
		}

		return null;
	},
);

export const logout = createAsyncThunk(
	AuthenticationActionTypes.LOGOUT,
	async (_, { dispatch }) => {
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		localStorage.removeItem('userName');
		localStorage.removeItem('userEmail');
		localStorage.removeItem('tokenExpiration');

		clearTimeout(timer);

		dispatch(authSlice.actions.clearUser());
	},
);

export const autoLogout = createAsyncThunk(
	AuthenticationActionTypes.AUTO_LOGOUT,
	async (_, { dispatch }) => {
		dispatch(logout());
		dispatch(authSlice.actions.setAutoLogout());
	},
);

const authSlice = createSlice({
	name: 'authentication',
	initialState: {
		token: null,
		userId: null,
		userName: null,
		userEmail: null,
		didAutoLogout: false,
	},
	reducers: {
		clearUser(state) {
			state.token = null;
			state.userId = null;
			state.userName = null;
			state.userEmail = null;
		},
		setAutoLogout(state) {
			state.didAutoLogout = true;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(login.fulfilled, (state, action) => {
				state.token = action.payload.token;
				state.userId = action.payload.userId;
				state.userName = action.payload.userName;
				state.userEmail = action.payload.userEmail;
				state.didAutoLogout = false;
			})
			.addCase(tryLogin.fulfilled, (state, action) => {
				if (action.payload) {
					state.token = action.payload.token;
					state.userId = action.payload.userId;
					state.userName = action.payload.userName;
					state.userEmail = action.payload.userEmail;
				}
			});
	},
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
