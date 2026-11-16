import { signOut } from 'firebase/auth'

import { getFirebaseAuth } from '@/services/firebase/firebase'

import { API_DATABASE, COMMON_HEADERS } from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'

const UNAUTHORISED = 401

// A token the database refuses means the session is no longer valid, so it ends, and the session listener sends the traveller to log in
const endRefusedSession = async (response) => {
	const { error } = await response.json().catch(() => ({}))
	if (error === API_DATABASE.PERMISSION_DENIED) return

	try {
		await signOut(getFirebaseAuth())
	} catch {
		// The request error is still reported; a failed sign-out leaves the next refused request to try again
	}
}

// Returns the response so each thunk keeps its own parsing: a Firebase DELETE has no body worth reading
export const databaseRequest = async (
	path,
	{ method = API_DATABASE.GET, token, params, body } = {},
) => {
	const query = new URLSearchParams({
		...(API_DATABASE.NAMESPACE && { ns: API_DATABASE.NAMESPACE }),
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
		if (token && response.status === UNAUTHORISED) {
			await endRefusedSession(response)
		}
		throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
	}

	return response
}
