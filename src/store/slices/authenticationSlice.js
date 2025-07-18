import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import { AUTHENTICATION_ACTION_TYPES } from '@/constants/action-types'
import { API_DATABASE } from '@/constants/api'

let timer

export const selectAuthenticationToken = (state) => state.authentication.token

export const login = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.LOGIN,
	async (payload, { dispatch, rejectWithValue }) => {
		const url =
			payload.mode === API_DATABASE.API_AUTH_SIGNUP_MODE
				? `${API_DATABASE.API_URL}signUp?key=${API_DATABASE.API_KEY}`
				: `${API_DATABASE.API_URL}signInWithPassword?key=${API_DATABASE.API_KEY}`

		try {
			const response = await fetch(url, {
				method: API_DATABASE.POST,
				body: JSON.stringify({
					email: payload.email,
					password: payload.password,
					returnSecureToken: true,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error.message || 'Login failed.')
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
	},
	reducers: {
		clearUser(state) {
			state.token = null
			state.userId = null
			state.userName = null
			state.userEmail = null
			state.didAutoLogout = false
		},
		setAutoLogout(state, action) {
			state.didAutoLogout = action.payload ?? true
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(login.fulfilled, (state, action) => {
				state.token = action.payload.token
				state.userId = action.payload.userId
				state.userName = action.payload.userName
				state.userEmail = action.payload.userEmail
				state.didAutoLogout = false
			})
			.addCase(tryLogin.fulfilled, (state, action) => {
				if (action.payload) {
					state.token = action.payload.token
					state.userId = action.payload.userId
					state.userName = action.payload.userName
					state.userEmail = action.payload.userEmail
				}
			})
	},
})

export const authActions = authSlice.actions
export default authSlice.reducer
