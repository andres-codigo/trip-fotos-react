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
	ERROR_UPDATING_TRAVELLER: 'An error occurred while updating traveller ',
	FAILED_TO_UPDATE_TRAVELLER: 'Failed to update traveller ',
	INVALID_PASSWORD: 'INVALID_PASSWORD',
	NETWORK_ERROR: 'Network Error',
	AUTHENTICATING_TITLE: 'Authenticating',
	AUTHENTICATING_DETAILS: 'Authenticating your details, one moment please...',
	TEST_ERROR: 'Test error message',
	LOAD_FAILED: 'Load failed',
	SOMETHING_WENT_WRONG: 'Something went wrong!',
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
