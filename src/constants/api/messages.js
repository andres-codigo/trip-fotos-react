export const API_ERROR_MESSAGE = Object.freeze({
	// Browser/Network technical strings (Logic checks)
	FAILED_TO_FETCH: 'Failed to fetch',
	NETWORK_ERROR: 'Network Error',

	// Technical log prefixes
	REGISTER_TRAVELLER_CATCH: 'An error occurred while registering traveller ',
	UPDATE_TRAVELLER_NAME_CATCH: 'An error occurred while updating traveller ',
	UPDATE_TRAVELLER_CATCH:
		'An error occurred while saving the trip of traveller ',
	LOAD_TRAVELLER_CATCH: 'An error occurred while loading traveller ',
	UPDATE_TRAVELLERS_CATCH: 'An error occurred while updating travellers ',
	LOAD_PUBLIC_TRIPS_CATCH: 'An error occurred while loading public trips ',
	CHECK_IS_TRAVELLER_CATCH:
		'An error occurred while checking traveller registration for ',
	DELETE_TRAVELLER_CATCH: 'An error occurred while deleting traveller ',
	DELETE_TRAVELLER_MESSAGES_CATCH:
		'An error occurred while deleting messages for traveller ',
	CONTACT_TRAVELLER_CATCH: 'An error occurred while contacting traveller ',
	LOAD_MESSAGES_CATCH: 'An error occurred while loading messages ',
	DELETE_MESSAGE_CATCH: 'An error occurred while deleting message ',
	MARK_MESSAGES_READ_CATCH: 'An error occurred while marking messages read ',
	LOAD_CONVERSATIONS_CATCH: 'An error occurred while loading conversations ',
	LOAD_THREAD_CATCH: 'An error occurred while loading conversation ',
	SEND_MESSAGE_CATCH: 'An error occurred while sending a message to ',
	MARK_CONVERSATION_READ_CATCH:
		'An error occurred while marking conversation read ',
	DELETE_CONVERSATION_CATCH: 'An error occurred while deleting conversation ',
	DELETE_LEGACY_MESSAGE_CATCH:
		'An error occurred while deleting legacy message ',

	// API Response Codes/Strings
	STORAGE_OBJECT_NOT_FOUND: 'storage/object-not-found',
})
