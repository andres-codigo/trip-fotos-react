import { API_DATABASE, COMMON_HEADERS } from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'

// Returns the response so each thunk keeps its own parsing: a Firebase DELETE has no body worth reading
export const databaseRequest = async (
	path,
	{ method = API_DATABASE.GET, token, params, body } = {},
) => {
	const query = new URLSearchParams({
		...(token && { auth: token }),
		...params,
	}).toString()

	const response = await fetch(
		`${API_DATABASE.BASE_URL}${path}.json${query && `?${query}`}`,
		{
			method,
			headers: COMMON_HEADERS.JSON,
			...(body !== undefined && { body: JSON.stringify(body) }),
		},
	)

	if (!response.ok) {
		throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
	}

	return response
}
