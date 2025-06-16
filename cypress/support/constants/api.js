export const apiDatabase = {
	// API
	apiUrl: Cypress.env('API_URL'),
	apiKey: Cypress.env('API_KEY'),

	// DATABASE
	POST: 'POST',
}

export const apiUrls = {
	signInWithPassword: `${apiDatabase.apiUrl}signInWithPassword?key=${apiDatabase.apiKey}`,
}
