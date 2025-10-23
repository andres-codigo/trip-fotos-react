import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'

import { AUTHENTICATION_ACTION_TYPES } from '@/constants/redux'
import { API_DATABASE } from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'
import { COMMON_HEADERS } from '@/constants/api'

let timer

export const login = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.LOGIN,
	async (payload, { dispatch, rejectWithValue }) => {
		const url =
			payload.mode === API_DATABASE.AUTH_SIGNUP_MODE
				? `${API_DATABASE.URL}signUp?key=${API_DATABASE.KEY}`
				: `${API_DATABASE.URL}signInWithPassword?key=${API_DATABASE.KEY}`

		try {
			const response = await fetch(url, {
				method: API_DATABASE.POST,
				body: JSON.stringify({
					email: payload.email,
					password: payload.password,
					returnSecureToken: true,
				}),
				headers: COMMON_HEADERS.JSON,
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(
					data.error.message || ERROR_MESSAGES.LOGIN_FAILED_FALLBACK,
				)
			}

			const expiresIn = +data.expiresIn * 1000
			const expirationDate = new Date().getTime() + expiresIn

			localStorage.setItem('token', data.idToken)
			localStorage.setItem('userId', data.localId)
			localStorage.setItem('userName', data.displayName || '')
			localStorage.setItem('userEmail', data.email)
			localStorage.setItem('tokenExpiration', expirationDate)

			timer = setTimeout(() => {
				dispatch(autoLogout())
			}, expiresIn)

			return {
				token: data.idToken,
				userId: data.localId,
				userName: data.displayName || '',
				userEmail: data.email,
			}
		} catch (error) {
			return rejectWithValue(error.message)
		}
	},
)

export const tryLogin = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.TRY_LOGIN,
	async (_, { dispatch }) => {
		const token = localStorage.getItem('token')
		const userId = localStorage.getItem('userId')
		const userName = localStorage.getItem('userName')
		const userEmail = localStorage.getItem('userEmail')
		const tokenExpiration = localStorage.getItem('tokenExpiration')

		if (
			!token ||
			!tokenExpiration ||
			new Date().getTime() > +tokenExpiration
		) {
			dispatch(authActions.clearUser())
			dispatch(authActions.setAutoLogout(false))
			return null
		}

		const expiresIn = +tokenExpiration - new Date().getTime()
		timer = setTimeout(() => {
			dispatch(autoLogout())
		}, expiresIn)

		dispatch(authActions.setAutoLogout(false))

		return {
			token,
			userId,
			userName,
			userEmail,
		}
	},
)

export const logout = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.LOGOUT,
	async (_, { dispatch }) => {
		localStorage.removeItem('token')
		localStorage.removeItem('userId')
		localStorage.removeItem('userName')
		localStorage.removeItem('userEmail')
		localStorage.removeItem('tokenExpiration')

		clearTimeout(timer)

		dispatch(authActions.clearUser())
	},
)

export const autoLogout = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.AUTO_LOGOUT,
	async (_, { dispatch }) => {
		dispatch(logout())
		dispatch(authActions.clearUser())
		dispatch(authActions.setAutoLogout())
	},
)

const authSlice = createSlice({
	name: 'authentication',
	initialState: {
		token: null,
		userId: null,
		userName: null,
		userEmail: null,
		didAutoLogout: false,
		status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
		error: null,
	},
	reducers: {
		clearUser(state) {
			state.token = null
			state.userId = null
			state.userName = null
			state.userEmail = null
			state.didAutoLogout = false
			state.status = 'idle'
			state.error = null
		},
		setAutoLogout(state, action) {
			state.didAutoLogout = action.payload ?? true
		},
	},
	extraReducers: (builder) => {
		builder
			// LOGIN async thunk handlers
			.addCase(login.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(login.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.token = action.payload.token
				state.userId = action.payload.userId
				state.userName = action.payload.userName
				state.userEmail = action.payload.userEmail
				state.didAutoLogout = false
				state.error = null
			})
			.addCase(login.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// TRY_LOGIN async thunk handlers
			.addCase(tryLogin.pending, (state) => {
				state.status = 'loading'
			})
			.addCase(tryLogin.fulfilled, (state, action) => {
				state.status = 'succeeded'
				if (action.payload) {
					state.token = action.payload.token
					state.userId = action.payload.userId
					state.userName = action.payload.userName
					state.userEmail = action.payload.userEmail
				}
			})
			.addCase(tryLogin.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// LOGOUT async thunk handlers
			.addCase(logout.pending, (state) => {
				state.status = 'loading'
			})
			.addCase(logout.fulfilled, (state) => {
				state.status = 'succeeded'
				// User data is cleared by the clearUser action called within logout thunk
			})
			.addCase(logout.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// AUTO_LOGOUT async thunk handlers
			.addCase(autoLogout.pending, (state) => {
				state.status = 'loading'
			})
			.addCase(autoLogout.fulfilled, (state) => {
				state.status = 'succeeded'
				// User data is cleared by actions called within autoLogout thunk
			})
			.addCase(autoLogout.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})
	},
})

export const selectAuthenticationState = (state) => state.authentication

// Memoized selectors using createSelector
export const selectAuthenticationToken = createSelector(
	[selectAuthenticationState],
	(authState) => authState.token,
)

export const selectIsAuthenticated = createSelector(
	[selectAuthenticationToken],
	(token) => !!token,
)

export const selectUserId = createSelector(
	[selectAuthenticationState],
	(authState) => authState.userId,
)

export const selectUserName = createSelector(
	[selectAuthenticationState],
	(authState) => authState.userName,
)

export const selectUserEmail = createSelector(
	[selectAuthenticationState],
	(authState) => authState.userEmail,
)

export const selectDidAutoLogout = createSelector(
	[selectAuthenticationState],
	(authState) => authState.didAutoLogout,
)

export const selectUserProfile = createSelector(
	[selectUserId, selectUserName, selectUserEmail],
	(userId, userName, userEmail) => ({
		userId,
		userName,
		userEmail,
	}),
)

export const selectAuthenticationStatus = createSelector(
	[selectAuthenticationState],
	(authState) => authState.status,
)

export const selectAuthenticationError = createSelector(
	[selectAuthenticationState],
	(authState) => authState.error,
)

export const selectIsAuthLoading = createSelector(
	[selectAuthenticationStatus],
	(status) => status === 'loading',
)

export const authActions = authSlice.actions
export default authSlice.reducer
