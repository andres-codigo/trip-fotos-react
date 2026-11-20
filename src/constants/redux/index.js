// Base action types (used in createAsyncThunk)
const TRAVELLERS_BASE_ACTIONS = Object.freeze({
	TRAVELLER_NAME: 'travellers/travellerName',
	LOAD_TRAVELLERS: 'travellers/loadTravellers',
	LOAD_TRAVELLER: 'travellers/loadTraveller',
	UPDATE_TRAVELLERS: 'travellers/updateTravellers',
	REGISTER_TRAVELLER: 'travellers/registerTraveller',
	UPDATE_TRAVELLER: 'travellers/updateTraveller',
	DELETE_TRAVELLER: 'travellers/deleteTraveller',
	CHECK_IS_TRAVELLER: 'travellers/checkIsTraveller',
	LOAD_PUBLIC_TRIPS: 'travellers/loadPublicTrips',
})

export const MESSAGES_ACTION_TYPES = Object.freeze({
	DELETE_TRAVELLER_MESSAGES: 'messages/deleteTravellerMessages',
	LOAD_CONVERSATIONS: 'messages/loadConversations',
	LOAD_THREAD: 'messages/loadThread',
	SEND_MESSAGE: 'messages/sendMessage',
	MARK_CONVERSATION_READ: 'messages/markConversationRead',
	DELETE_CONVERSATION: 'messages/deleteConversation',
	DELETE_LEGACY_MESSAGE: 'messages/deleteLegacyMessage',
})

export const AUTHENTICATION_ACTION_TYPES = Object.freeze({
	LOGIN: 'authentication/login',
	LOGOUT: 'authentication/logout',
	SEND_PASSWORD_RESET: 'authentication/sendPasswordReset',
	RESEND_VERIFICATION: 'authentication/resendVerification',
	REFRESH_VERIFICATION: 'authentication/refreshVerification',
	START_AGAIN: 'authentication/startAgain',
	APPLY_EMAIL_VERIFICATION: 'authentication/applyEmailVerification',
	CHECK_PASSWORD_RESET_CODE: 'authentication/checkPasswordResetCode',
	CONFIRM_PASSWORD_RESET: 'authentication/confirmPasswordReset',
	CHANGE_PASSWORD: 'authentication/changePassword',
	CHANGE_EMAIL: 'authentication/changeEmail',
	RESEND_EMAIL_CHANGE: 'authentication/resendEmailChange',
	APPLY_EMAIL_CHANGE: 'authentication/applyEmailChange',
})

// Helper function to create async thunk action types
const createAsyncActionTypes = (baseType) => ({
	PENDING: `${baseType}/pending`,
	FULFILLED: `${baseType}/fulfilled`,
	REJECTED: `${baseType}/rejected`,
})

// Complete action types with async variants
export const TRAVELLERS_ACTION_TYPES = Object.freeze({
	...TRAVELLERS_BASE_ACTIONS,
	LOAD_TRAVELLERS_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.LOAD_TRAVELLERS,
	),
	CHECK_IS_TRAVELLER_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.CHECK_IS_TRAVELLER,
	),
})
