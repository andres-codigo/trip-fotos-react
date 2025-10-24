export const API_DATABASE = Object.freeze({
	// API
	URL: import.meta.env.VITE_API_URL,
	KEY: import.meta.env.VITE_API_KEY,
	AUTH_LOGIN_MODE: 'login',
	AUTH_SIGNUP_MODE: 'signup',

	// DATABASE
	BASE_URL: import.meta.env.VITE_BACKEND_BASE_URL,
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	DELETE: 'DELETE',
})
