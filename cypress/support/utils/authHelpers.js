import { API_DATABASE, SDK_METHOD_TYPE_URLS } from '../../../src/constants/api'
import { PATHS } from '../../../src/constants/ui/paths'
import { TEST_USERS } from '../../../src/constants/config/users'
import { SESSION_STORAGE_KEYS } from '../../../src/constants/auth'

const REQUEST_TIMEOUT = 10000

const SDK_USER_KEY = /^firebase:authUser:/

// The app keeps its session in localStorage (SESSION_STORAGE_KEYS) and the Auth SDK keeps its user there too (browserLocalPersistence), so cy.session restores both and reading the restored storage is enough: no page load
export const isSessionValid = (storage, email, now = Date.now()) => {
	if (!storage?.[SESSION_STORAGE_KEYS.TOKEN]) return false
	if (!(Number(storage[SESSION_STORAGE_KEYS.TOKEN_EXPIRATION]) > now))
		return false
	// Firebase stores the address in lower case
	if (storage[SESSION_STORAGE_KEYS.USER_EMAIL] !== email?.toLowerCase())
		return false
	const sdkUser = Object.keys(storage).find((key) => SDK_USER_KEY.test(key))
	// tryLogin logs out when the SDK user and the stored user differ
	return (
		Boolean(sdkUser) &&
		JSON.parse(storage[sdkUser]).uid ===
			storage[SESSION_STORAGE_KEYS.USER_ID]
	)
}

const validateSession = (email) =>
	cy.getAllLocalStorage().then((origins) => {
		const storage = origins[new URL(Cypress.config('baseUrl')).origin]
		return isSessionValid(storage, email)
	})

export const performLogin = (
	email = TEST_USERS.STANDARD.EMAIL,
	password = TEST_USERS.STANDARD.PASSWORD,
	expectedRedirectUrl = PATHS.HOME,
) => {
	cy.session(
		`user-session-${email}`,
		() => {
			cy.visit(PATHS.AUTHENTICATION)
			cy.interceptLogin(
				API_DATABASE.POST,
				SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			)
			cy.login(email, password)
			cy.wait('@loginRequest', { timeout: REQUEST_TIMEOUT })
			// The Auth SDK makes a follow-up call before the session is stored, so wait for it before cy.session snapshots storage
			cy.window({ timeout: REQUEST_TIMEOUT }).should((win) => {
				expect(win.localStorage.getItem('token')).to.be.a('string')
			})
			cy.url({ timeout: REQUEST_TIMEOUT }).should('include', PATHS.HOME)
		},
		{
			// One UI login per user per run; cy.resetEmulators clears the saved sessions when the seed recreates the users
			cacheAcrossSpecs: true,
			validate: () => validateSession(email),
		},
	)

	cy.visit(expectedRedirectUrl)
	cy.url({ timeout: REQUEST_TIMEOUT }).should('include', expectedRedirectUrl)
}

export const loginAndNavigateToHome = (
	email = TEST_USERS.STANDARD.EMAIL,
	password = TEST_USERS.STANDARD.PASSWORD,
) => {
	cy.visit(PATHS.AUTHENTICATION) // Assuming auth route exists
	performLogin(email, password)
}
