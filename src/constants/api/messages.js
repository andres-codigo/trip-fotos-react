export const API_ERROR_MESSAGE = Object.freeze({
	// Browser/Network technical strings (Logic checks)
	FAILED_TO_FETCH: 'Failed to fetch',
	NETWORK_ERROR: 'Network Error',

	// Technical log prefixes
	REGISTER_TRAVELLER_CATCH: 'An error occurred while registering traveller ',
	UPDATE_TRAVELLER_NAME_CATCH: 'An error occurred while updating traveller ',
	LOAD_TRAVELLER_CATCH: 'An error occurred while loading traveller ',
	UPDATE_TRAVELLERS_CATCH: 'An error occurred while updating travellers ',
	CHECK_IS_TRAVELLER_CATCH:
		'An error occurred while checking traveller registration for ',
	DELETE_TRAVELLER_CATCH: 'An error occurred while deleting traveller ',
	DELETE_TRAVELLER_MESSAGES_CATCH:
		'An error occurred while deleting messages for traveller ',
	CONTACT_TRAVELLER_CATCH: 'An error occurred while contacting traveller ',
	LOAD_MESSAGES_CATCH: 'An error occurred while loading messages ',
	DELETE_MESSAGE_CATCH: 'An error occurred while deleting message ',

	// API Response Codes/Strings
	STORAGE_OBJECT_NOT_FOUND: 'storage/object-not-found',
	INVALID_PASSWORD: 'INVALID_PASSWORD',
})
