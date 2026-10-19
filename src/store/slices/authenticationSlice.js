import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
} from 'firebase/auth'

import { getFirebaseAuth } from '@/services/firebase/firebase'

import { AUTHENTICATION_ACTION_TYPES } from '@/constants/redux'
import { API_DATABASE } from '@/constants/api'
import { FIREBASE_ERRORS } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'

let timer

export const login = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.LOGIN,
	async (payload, { dispatch, rejectWithValue }) => {
		// The SDK session is what authorises Cloud Storage uploads; the REST API alone leaves Storage anonymous
		const authenticate =
			payload.mode === API_DATABASE.AUTH_SIGNUP_MODE
				? createUserWithEmailAndPassword
				: signInWithEmailAndPassword

		try {
			const { user } = await authenticate(
				getFirebaseAuth(),
				payload.email,
				payload.password,
			)
			const { token, expirationTime, claims } =
				await user.getIdTokenResult()

			const expirationDate = new Date(expirationTime).getTime()
			const expiresIn = expirationDate - new Date().getTime()
			const userName = user.displayName || ''
			const isAdmin = claims?.admin === true

			localStorage.setItem('token', token)
			localStorage.setItem('userId', user.uid)
			localStorage.setItem('userName', userName)
			localStorage.setItem('userEmail', user.email)
			localStorage.setItem('tokenExpiration', expirationDate)
			localStorage.setItem('isAdmin', isAdmin)

			timer = setTimeout(() => {
				dispatch(autoLogout())
			}, expiresIn)

			return {
				token,
				userId: user.uid,
				userName,
				userEmail: user.email,
				isAdmin,
			}
		} catch (error) {
			if (error.code) {
				return rejectWithValue(
					FIREBASE_ERRORS.SDK_ERROR_CODES[error.code] ?? error.code,
				)
			}
			return rejectWithValue(
				error.message || ERROR_MESSAGES.LOGIN_FAILED_FALLBACK,
			)
		}
	},
)

export const tryLogin = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.TRY_LOGIN,
	async (_, { dispatch, rejectWithValue }) => {
		try {
			const token = localStorage.getItem('token')
			const userId = localStorage.getItem('userId')
			const userName = localStorage.getItem('userName')
			const userEmail = localStorage.getItem('userEmail')
			const tokenExpiration = localStorage.getItem('tokenExpiration')
			const isAdmin = localStorage.getItem('isAdmin') === 'true'

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
				isAdmin,
			}
		} catch (error) {
			return rejectWithValue(error.message)
		}
	},
)

export const logout = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.LOGOUT,
	async (_, { dispatch, rejectWithValue }) => {
		try {
			localStorage.removeItem('token')
			localStorage.removeItem('userId')
			localStorage.removeItem('userName')
			localStorage.removeItem('userEmail')
			localStorage.removeItem('tokenExpiration')
			localStorage.removeItem('isAdmin')

			clearTimeout(timer)

			dispatch(authActions.clearUser())

			await signOut(getFirebaseAuth())
		} catch (error) {
			return rejectWithValue(error.message)
		}
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
		isAdmin: false,
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
			state.isAdmin = false
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
				state.isAdmin = action.payload.isAdmin
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
					state.isAdmin = action.payload.isAdmin
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

export const selectIsAdmin = createSelector(
	[selectAuthenticationState],
	(authState) => authState.isAdmin,
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
