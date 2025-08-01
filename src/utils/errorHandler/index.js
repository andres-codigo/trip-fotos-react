export const handleApiError = (error, defaultMessage) => {
	return error?.message || defaultMessage || 'An unknown error occurred.'
}
