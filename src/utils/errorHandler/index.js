import { ERROR_MESSAGES } from '@/constants/errors'

// Accepts a thrown Error or a rejected thunk payload, which is already a string
export const handleApiError = (error, defaultMessage) => {
	const message = typeof error === 'string' ? error : error?.message
	return message || defaultMessage || ERROR_MESSAGES.SOMETHING_WENT_WRONG
}
