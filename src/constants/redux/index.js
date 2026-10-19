// Base action types (used in createAsyncThunk)
const TRAVELLERS_BASE_ACTIONS = Object.freeze({
	TRAVELLER_NAME: 'travellers/travellerName',
	LOAD_TRAVELLERS: 'travellers/loadTravellers',
	LOAD_TRAVELLER: 'travellers/loadTraveller',
	UPDATE_TRAVELLERS: 'travellers/updateTravellers',
	REGISTER_TRAVELLER: 'travellers/registerTraveller',
	DELETE_TRAVELLER: 'travellers/deleteTraveller',
	DELETE_TRAVELLER_MESSAGES: 'travellers/deleteTravellerMessages',
})

const MESSAGES_BASE_ACTIONS = Object.freeze({
	CONTACT_TRAVELLER: 'messages/contactTraveller',
	LOAD_MESSAGES: 'messages/loadMessages',
	DELETE_MESSAGE: 'messages/deleteMessage',
})

const AUTHENTICATION_BASE_ACTIONS = Object.freeze({
	LOGIN: 'authentication/login',
	TRY_LOGIN: 'authentication/tryLogin',
	LOGOUT: 'authentication/logout',
	AUTO_LOGOUT: 'authentication/autoLogout',
})

// Helper function to create async thunk action types
const createAsyncActionTypes = (baseType) => ({
	PENDING: `${baseType}/pending`,
	FULFILLED: `${baseType}/fulfilled`,
	REJECTED: `${baseType}/rejected`,
})

// Complete action types with async variants
export const TRAVELLERS_ACTION_TYPES = Object.freeze({
	// Base actions
	...TRAVELLERS_BASE_ACTIONS,

	// Async thunk action types
	TRAVELLER_NAME_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.TRAVELLER_NAME,
	),
	LOAD_TRAVELLERS_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.LOAD_TRAVELLERS,
	),
	LOAD_TRAVELLER_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.LOAD_TRAVELLER,
	),
	UPDATE_TRAVELLERS_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.UPDATE_TRAVELLERS,
	),
	DELETE_TRAVELLER_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.DELETE_TRAVELLER,
	),
	DELETE_TRAVELLER_MESSAGES_ASYNC: createAsyncActionTypes(
		TRAVELLERS_BASE_ACTIONS.DELETE_TRAVELLER_MESSAGES,
	),
})

export const MESSAGES_ACTION_TYPES = Object.freeze({
	// Base actions
	...MESSAGES_BASE_ACTIONS,

	// Async thunk action types
	CONTACT_TRAVELLER_ASYNC: createAsyncActionTypes(
		MESSAGES_BASE_ACTIONS.CONTACT_TRAVELLER,
	),
	LOAD_MESSAGES_ASYNC: createAsyncActionTypes(
		MESSAGES_BASE_ACTIONS.LOAD_MESSAGES,
	),
	DELETE_MESSAGE_ASYNC: createAsyncActionTypes(
		MESSAGES_BASE_ACTIONS.DELETE_MESSAGE,
	),
})

export const AUTHENTICATION_ACTION_TYPES = Object.freeze({
	// Base actions
	...AUTHENTICATION_BASE_ACTIONS,

	// Async thunk action types
	LOGIN_ASYNC: createAsyncActionTypes(AUTHENTICATION_BASE_ACTIONS.LOGIN),
	TRY_LOGIN_ASYNC: createAsyncActionTypes(
		AUTHENTICATION_BASE_ACTIONS.TRY_LOGIN,
	),
	LOGOUT_ASYNC: createAsyncActionTypes(AUTHENTICATION_BASE_ACTIONS.LOGOUT),
	AUTO_LOGOUT_ASYNC: createAsyncActionTypes(
		AUTHENTICATION_BASE_ACTIONS.AUTO_LOGOUT,
	),
})
