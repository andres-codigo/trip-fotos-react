import { ERROR_MESSAGES } from '@/constants/error-messages'

export const MOCK_STATUS = {
	IDLE: 'idle',
	LOADING: 'loading',
	SUCCEEDED: 'succeeded',
	FAILED: 'failed',
}

export const MOCK_STATE_VALUES = {
	EMPTY_STRING: '',
	NULL: null,
	TRUE: true,
	FALSE: false,
	EMPTY_ARRAY: [],
}

export const MOCK_MESSAGES = Object.freeze({
	// Reference shared error messages
	SOMETHING_WENT_WRONG: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
	NETWORK_ERROR: ERROR_MESSAGES.NETWORK_ERROR,
	ERROR_UPDATING_TRAVELLER: ERROR_MESSAGES.ERROR_UPDATING_TRAVELLER,
	FAILED_TO_UPDATE_TRAVELLER: ERROR_MESSAGES.FAILED_TO_UPDATE_TRAVELLER,
	INVALID_PASSWORD: ERROR_MESSAGES.INVALID_PASSWORD,

	// Keep test-only messages
	AUTHENTICATING_TITLE: 'Authenticating',
	AUTHENTICATING_DETAILS: 'Authenticating your details, one moment please...',
	TEST_ERROR: 'Test error message',
	LOAD_FAILED: 'Load failed',
	CLOSEABLE_ERROR: 'Closeable error',
})

export const MOCK_TEST_VALUES = Object.freeze({
	FALSY_VALUES: [null, undefined, '', false, 0],
	TRUTHY_VALUES: ['text', 1, true, {}, []],
})

export const MOCK_TIME = {
	SEVENTY_SECONDS_AGO: 70000,
	THIRTY_SECONDS_AGO: 30000,
}
