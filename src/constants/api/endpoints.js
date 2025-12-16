const isCypress = typeof Cypress !== 'undefined'

export const API_DATABASE = Object.freeze({
	// API
	URL:
		isCypress && Cypress.env('API_URL')
			? Cypress.env('API_URL')
			: import.meta.env.VITE_API_URL,
	KEY:
		isCypress && Cypress.env('API_KEY')
			? Cypress.env('API_KEY')
			: import.meta.env.VITE_API_KEY,
	AUTH_LOGIN_MODE: 'login',
	AUTH_SIGNUP_MODE: 'signup',

	// DATABASE
	BASE_URL:
		isCypress && Cypress.env('VITE_DATABASE_URL')
			? Cypress.env('VITE_DATABASE_URL')
			: import.meta.env.VITE_BACKEND_BASE_URL,
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	DELETE: 'DELETE',
})
