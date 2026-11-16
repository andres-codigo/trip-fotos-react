import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import {
	applyActionCode,
	checkActionCode,
	confirmPasswordReset as confirmFirebasePasswordReset,
	createUserWithEmailAndPassword,
	deleteUser,
	EmailAuthProvider,
	onIdTokenChanged,
	reauthenticateWithCredential,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	updatePassword,
	verifyBeforeUpdateEmail,
	verifyPasswordResetCode,
} from 'firebase/auth'

import { getFirebaseAuth } from '@/services/firebase/firebase'

import { AUTHENTICATION_ACTION_TYPES } from '@/constants/redux'
import { API_DATABASE } from '@/constants/api'
import {
	ACTION_CODE_ERROR_CODES,
	ACTION_CODE_ERRORS,
	FIREBASE_ERRORS,
} from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { VALIDATION_MESSAGES } from '@/constants/validation'
import { FIREBASE, savedUserStorageKey } from '@/constants/firebase'
import { PATHS } from '@/constants/ui'

// Firebase's default email page shows a Continue button back to this path. Preview
// domains are not authorised, so those emails go without the button rather than not at all
const sendWithContinue = async (send, path) => {
	try {
		await send({ url: `${window.location.origin}${path}` })
	} catch (error) {
		if (error.code !== 'auth/unauthorized-continue-uri') throw error
		await send()
	}
}

const sendVerification = (user) =>
	sendWithContinue(
		(...settings) => sendEmailVerification(user, ...settings),
		PATHS.REGISTER,
	)

const sessionFrom = (user, claims) => ({
	userId: user.uid,
	userName: user.displayName || '',
	userEmail: user.email,
	isAdmin: claims?.admin === true,
	emailVerified: user.emailVerified,
})

const sessionOf = async (user, forceRefresh = false) =>
	sessionFrom(user, (await user.getIdTokenResult(forceRefresh)).claims)

// The app kept its own copy of the session before the SDK was its only source; a browser that still has it no longer needs it
const LEGACY_SESSION_KEYS = [
	'token',
	'userId',
	'userName',
	'userEmail',
	'tokenExpiration',
	'isAdmin',
]

// The claims of the last token the SDK saved; it may have expired, but admin is only a hint until the SDK confirms the session
const savedClaims = (accessToken) => {
	try {
		const payload = accessToken
			.split('.')[1]
			.replace(/-/g, '+')
			.replace(/_/g, '/')
		return JSON.parse(atob(payload))
	} catch {
		return {}
	}
}

// Read at once on start-up, so a signed-in traveller sees their pages without waiting for the SDK's network round trip; watchSession then confirms the user or clears it
export const restoreSavedSession = (storage, apiKey) => {
	try {
		const saved = JSON.parse(storage.getItem(savedUserStorageKey(apiKey)))
		if (!saved?.uid) return null

		return {
			...sessionFrom(
				saved,
				savedClaims(saved.stsTokenManager?.accessToken),
			),
			// A saved user still needs the SDK's answer before a protected page can be trusted to it
			sessionChecked: false,
		}
	} catch {
		return null
	}
}

const savedSession = () =>
	typeof localStorage === 'undefined'
		? null
		: restoreSavedSession(localStorage, FIREBASE.API_KEY)

// The SDK renews the ID token itself when less than five minutes are left, so each request asks for it rather than keeping a copy; a request made while the saved session is still being confirmed waits for the SDK
export const getSessionToken = async () => {
	const auth = getFirebaseAuth()
	await auth.authStateReady()
	const user = auth.currentUser
	if (!user) return null

	try {
		return await user.getIdToken()
	} catch {
		throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
	}
}

// Started once by the app: a restored, renewed, revoked or ended session all reach Redux through here
export const watchSession = () => (dispatch) => {
	LEGACY_SESSION_KEYS.forEach((key) => localStorage.removeItem(key))

	return onIdTokenChanged(getFirebaseAuth(), async (user) => {
		if (!user) {
			dispatch(authActions.clearUser())
			return
		}

		// Offline with an expired token the claims cannot be read yet; the renewal once back online reports the user again
		const session = await sessionOf(user).catch(() => sessionFrom(user, {}))

		// A later change may have reported before this one finished
		if (getFirebaseAuth().currentUser?.uid !== user.uid) return

		dispatch(authActions.setSession(session))
	})
}

const actionCodeReason = (error) =>
	ACTION_CODE_ERROR_CODES[error?.code] ?? ACTION_CODE_ERRORS.INVALID

export const login = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.LOGIN,
	async (payload, { rejectWithValue }) => {
		const isSignup = payload.mode === API_DATABASE.AUTH_SIGNUP_MODE
		// The SDK session is what authorises Cloud Storage uploads; the REST API alone leaves Storage anonymous
		const authenticate = isSignup
			? createUserWithEmailAndPassword
			: signInWithEmailAndPassword

		try {
			const { user } = await authenticate(
				getFirebaseAuth(),
				payload.email,
				payload.password,
			)

			// A failed send still leaves the account; Check your inbox offers to send it again
			if (isSignup) await sendVerification(user).catch(() => {})

			return {
				...(await sessionOf(user)),
				awaitingVerification: isSignup,
			}
		} catch (error) {
			return rejectWithValue(
				FIREBASE_ERRORS.SDK_ERROR_CODES[error.code] ??
					ERROR_MESSAGES.LOGIN_FAILED,
			)
		}
	},
)

export const resendVerification = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.RESEND_VERIFICATION,
	async (_, { rejectWithValue }) => {
		try {
			// The strip shows from the saved session at once, before the SDK has restored its user
			const auth = getFirebaseAuth()
			await auth.authStateReady()
			const user = auth.currentUser
			await sendVerification(user)
			return user.email
		} catch (error) {
			return rejectWithValue(
				error.code === 'auth/too-many-requests'
					? ERROR_MESSAGES.TOO_MANY_EMAILS
					: ERROR_MESSAGES.VERIFICATION_EMAIL_FAILED,
			)
		}
	},
)

export const refreshVerification = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.REFRESH_VERIFICATION,
	async (_, { rejectWithValue }) => {
		try {
			const auth = getFirebaseAuth()
			await auth.authStateReady()
			const user = auth.currentUser
			if (!user) return { emailVerified: false }

			await user.reload()
			if (!user.emailVerified) return { emailVerified: false }

			// The rules read email_verified from the ID token, so a fresh token makes it live at once
			return sessionOf(user, true)
		} catch {
			return rejectWithValue(ERROR_MESSAGES.VERIFICATION_CHECK_FAILED)
		}
	},
)

export const startAgain = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.START_AGAIN,
	async (_, { dispatch, rejectWithValue }) => {
		try {
			const user = getFirebaseAuth().currentUser
			const { email } = user
			await deleteUser(user)
			await dispatch(logout())
			return email
		} catch {
			return rejectWithValue(ERROR_MESSAGES.START_AGAIN_FAILED)
		}
	},
)

export const applyEmailVerification = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.APPLY_EMAIL_VERIFICATION,
	async (code, { dispatch, rejectWithValue }) => {
		const auth = getFirebaseAuth()
		await auth.authStateReady()

		try {
			await applyActionCode(auth, code)
		} catch (error) {
			const reason = actionCodeReason(error)
			const user = auth.currentUser

			// A used link is no error for an account that is already verified
			if (reason !== ACTION_CODE_ERRORS.NETWORK && user) {
				await user.reload().catch(() => {})
				if (user.emailVerified) {
					return { signedIn: true, alreadyVerified: true }
				}
			}
			return rejectWithValue(reason)
		}

		const signedIn = Boolean(auth.currentUser)
		if (signedIn) await dispatch(refreshVerification())

		return { signedIn, alreadyVerified: false }
	},
)

export const checkPasswordResetCode = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.CHECK_PASSWORD_RESET_CODE,
	async (code, { rejectWithValue }) => {
		try {
			return await verifyPasswordResetCode(getFirebaseAuth(), code)
		} catch (error) {
			return rejectWithValue(actionCodeReason(error))
		}
	},
)

export const confirmPasswordReset = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.CONFIRM_PASSWORD_RESET,
	async ({ code, password }, { rejectWithValue }) => {
		try {
			await confirmFirebasePasswordReset(
				getFirebaseAuth(),
				code,
				password,
			)
		} catch (error) {
			return rejectWithValue(actionCodeReason(error))
		}
	},
)

export const sendPasswordReset = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.SEND_PASSWORD_RESET,
	async (email, { rejectWithValue }) => {
		try {
			await sendWithContinue(
				(...settings) =>
					sendPasswordResetEmail(
						getFirebaseAuth(),
						email,
						...settings,
					),
				PATHS.AUTHENTICATION,
			)
			return email
		} catch (error) {
			// Answered like a sent link, so the page never tells anyone whether an account exists
			if (error.code === 'auth/user-not-found') return email

			return rejectWithValue(
				error.code === 'auth/too-many-requests'
					? ERROR_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS
					: ERROR_MESSAGES.PASSWORD_RESET_FAILED,
			)
		}
	},
)

const CHANGE_PASSWORD_ERRORS = {
	'auth/invalid-credential': ERROR_MESSAGES.WRONG_CURRENT_PASSWORD,
	'auth/wrong-password': ERROR_MESSAGES.WRONG_CURRENT_PASSWORD,
	'auth/weak-password': VALIDATION_MESSAGES.PASSWORD_TOO_SHORT,
	'auth/too-many-requests': ERROR_MESSAGES.TOO_MANY_ATTEMPTS,
}

export const changePassword = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.CHANGE_PASSWORD,
	async ({ currentPassword, newPassword }, { rejectWithValue }) => {
		try {
			const auth = getFirebaseAuth()
			await auth.authStateReady()
			const user = auth.currentUser

			await reauthenticateWithCredential(
				user,
				EmailAuthProvider.credential(user.email, currentPassword),
			)
			await updatePassword(user, newPassword)
			// A new password revokes the old refresh token; the fresh one keeps this device signed in
			await user.getIdToken(true)
		} catch (error) {
			return rejectWithValue(
				CHANGE_PASSWORD_ERRORS[error?.code] ??
					ERROR_MESSAGES.PASSWORD_CHANGE_FAILED,
			)
		}
	},
)

const CHANGE_EMAIL_ERRORS = {
	'auth/invalid-credential': ERROR_MESSAGES.WRONG_CURRENT_PASSWORD,
	'auth/wrong-password': ERROR_MESSAGES.WRONG_CURRENT_PASSWORD,
	'auth/email-already-in-use': ERROR_MESSAGES.EMAIL_CANNOT_BE_USED,
	'auth/invalid-email': ERROR_MESSAGES.EMAIL_CANNOT_BE_USED,
	'auth/invalid-new-email': ERROR_MESSAGES.EMAIL_CANNOT_BE_USED,
	'auth/too-many-requests': ERROR_MESSAGES.TOO_MANY_ATTEMPTS,
	'auth/requires-recent-login': ERROR_MESSAGES.EMAIL_CHANGE_SIGN_IN_AGAIN,
}

// The link signs the user out on every device, so its Continue button goes to Log in
const sendEmailChange = (user, newEmail) =>
	sendWithContinue(
		(...settings) => verifyBeforeUpdateEmail(user, newEmail, ...settings),
		PATHS.AUTHENTICATION,
	)

export const changeEmail = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.CHANGE_EMAIL,
	async ({ newEmail, currentPassword }, { rejectWithValue }) => {
		try {
			const auth = getFirebaseAuth()
			await auth.authStateReady()
			const user = auth.currentUser

			await reauthenticateWithCredential(
				user,
				EmailAuthProvider.credential(user.email, currentPassword),
			)
			await sendEmailChange(user, newEmail)
			return newEmail
		} catch (error) {
			return rejectWithValue(
				CHANGE_EMAIL_ERRORS[error?.code] ??
					ERROR_MESSAGES.EMAIL_CHANGE_FAILED,
			)
		}
	},
)

// Sent without the password, so once the sign-in is no longer recent Firebase asks for it again
export const resendEmailChange = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.RESEND_EMAIL_CHANGE,
	async (newEmail, { rejectWithValue }) => {
		try {
			const auth = getFirebaseAuth()
			await auth.authStateReady()
			await sendEmailChange(auth.currentUser, newEmail)
			return newEmail
		} catch (error) {
			return rejectWithValue(
				error?.code === 'auth/too-many-requests'
					? ERROR_MESSAGES.TOO_MANY_EMAILS
					: (CHANGE_EMAIL_ERRORS[error?.code] ??
							ERROR_MESSAGES.EMAIL_CHANGE_FAILED),
			)
		}
	},
)

// Both links change the account's email, which revokes every session, so this device signs out too
export const applyEmailChange = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.APPLY_EMAIL_CHANGE,
	async (code, { dispatch, rejectWithValue }) => {
		const auth = getFirebaseAuth()
		await auth.authStateReady()

		try {
			const { data } = await checkActionCode(auth, code)
			await applyActionCode(auth, code)
			if (auth.currentUser) await dispatch(logout())
			return data.email
		} catch (error) {
			return rejectWithValue(actionCodeReason(error))
		}
	},
)

export const logout = createAsyncThunk(
	AUTHENTICATION_ACTION_TYPES.LOGOUT,
	async (_, { dispatch, rejectWithValue }) => {
		try {
			dispatch(authActions.clearUser())

			await signOut(getFirebaseAuth())
		} catch (error) {
			return rejectWithValue(error.message)
		}
	},
)

const signedOut = {
	userId: null,
	userName: null,
	userEmail: null,
	isAdmin: false,
	emailVerified: false,
	// Set by sign-up so the login page shows Check your inbox instead of moving on
	awaitingVerification: false,
	// False only while the SDK confirms a saved user; with none saved there is nothing to wait for
	sessionChecked: true,
	// The SDK reports a new user before sign-up has set Check your inbox, so the login result sets the session instead
	signingIn: false,
	status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
	error: null,
}

const authSlice = createSlice({
	name: 'authentication',
	initialState: () => ({ ...signedOut, ...savedSession() }),
	reducers: {
		clearUser(state) {
			state.signingIn = false
			state.userId = null
			state.userName = null
			state.userEmail = null
			state.isAdmin = false
			state.emailVerified = false
			state.awaitingVerification = false
			state.sessionChecked = true
			state.status = 'idle'
			state.error = null
		},
		clearAwaitingVerification(state) {
			state.awaitingVerification = false
		},
		awaitVerification(state) {
			state.awaitingVerification = true
		},
		setSession(state, action) {
			if (state.signingIn) return
			state.userId = action.payload.userId
			state.userName = action.payload.userName
			state.userEmail = action.payload.userEmail
			state.isAdmin = action.payload.isAdmin
			state.emailVerified = action.payload.emailVerified
			state.sessionChecked = true
		},
	},
	extraReducers: (builder) => {
		builder
			// LOGIN async thunk handlers
			.addCase(login.pending, (state) => {
				state.status = 'loading'
				state.signingIn = true
				state.error = null
			})
			.addCase(login.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.userId = action.payload.userId
				state.userName = action.payload.userName
				state.userEmail = action.payload.userEmail
				state.isAdmin = action.payload.isAdmin
				state.emailVerified = action.payload.emailVerified
				state.awaitingVerification = action.payload.awaitingVerification
				state.sessionChecked = true
				state.signingIn = false
				state.error = null
			})
			.addCase(login.rejected, (state, action) => {
				state.status = 'failed'
				state.signingIn = false
				state.error = action.payload
			})

			.addCase(refreshVerification.fulfilled, (state, action) => {
				state.emailVerified = action.payload.emailVerified
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
	},
})

export const selectAuthenticationState = (state) => state.authentication

export const selectUserId = createSelector(
	[selectAuthenticationState],
	(authState) => authState.userId,
)

export const selectIsAuthenticated = createSelector(
	[selectUserId],
	(userId) => !!userId,
)

export const selectSessionChecked = createSelector(
	[selectAuthenticationState],
	(authState) => authState.sessionChecked,
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

export const selectEmailVerified = createSelector(
	[selectAuthenticationState],
	(authState) => authState.emailVerified,
)

export const selectAwaitingVerification = createSelector(
	[selectAuthenticationState],
	(authState) => authState.awaitingVerification,
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
