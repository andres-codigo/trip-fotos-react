import { API_DATABASE, SDK_METHOD_TYPE_URLS } from '../../../src/constants/api'
import { VERIFY_EMAIL_CONFIG } from '../../../src/constants/auth'
import { AUTHENTICATION_FORM_SELECTORS } from '../../../src/constants/test/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { TEST_USERS } from '../../../src/constants/config/users'

const REQUEST_TIMEOUT = 10000

const SDK_USER_KEY = /^firebase:authUser:/

const sdkUserIn = (storage) => {
	const key = Object.keys(storage ?? {}).find((name) =>
		SDK_USER_KEY.test(name),
	)
	return key ? JSON.parse(storage[key]) : null
}

// The Auth SDK is the app's only session and keeps its user in localStorage (browserLocalPersistence), so cy.session restores it and reading the restored storage is enough: no page load. The SDK renews an expired ID token from the refresh token, so only the user and the refresh token matter
export const hasSdkSession = (storage, email) => {
	const user = sdkUserIn(storage)
	// Firebase stores the address in lower case
	return (
		Boolean(user?.stsTokenManager?.refreshToken) &&
		user.email === email?.toLowerCase()
	)
}

// For a spec that talks to the database directly, as the signed-in app would
export const sdkSessionOf = (win) => {
	const user = sdkUserIn({ ...win.localStorage })
	return {
		userId: user?.uid ?? null,
		token: user?.stsTokenManager?.accessToken ?? null,
	}
}

const validateSession = (email) =>
	cy.getAllLocalStorage().then((origins) => {
		const storage = origins[new URL(Cypress.config('baseUrl')).origin]
		return hasSdkSession(storage, email)
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
				expect(hasSdkSession({ ...win.localStorage }, email)).to.equal(
					true,
				)
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

// The sign-up journey up to Check your inbox, for specs that start from a new, unverified account
export const signUp = (email, password = TEST_USERS.STANDARD.PASSWORD) => {
	cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
	cy.interceptLogin(
		API_DATABASE.POST,
		`${API_DATABASE.URL}signUp?key=${API_DATABASE.KEY}`,
	)
	cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK).click()
	cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(email)
	cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(password)
	cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
	cy.wait('@loginRequest', { timeout: REQUEST_TIMEOUT })
	cy.get('h1', { timeout: REQUEST_TIMEOUT }).should(
		'have.text',
		VERIFY_EMAIL_CONFIG.TITLE,
	)
}

// Firebase's default email page verifies the address in another tab, as production does until the custom action URL is set; the auth emulator keeps every link it would have sent
export const verifyByLink = (email) =>
	cy
		.request(
			`${new URL(API_DATABASE.URL).origin}/emulator/v1/projects/${Cypress.expose('FIREBASE_PROJECT_ID')}/oobCodes`,
		)
		.then(({ body }) => {
			const { oobCode } = body.oobCodes.findLast(
				(code) =>
					code.email === email && code.requestType === 'VERIFY_EMAIL',
			)
			cy.request(
				API_DATABASE.POST,
				`${API_DATABASE.URL}update?key=${API_DATABASE.KEY}`,
				{ oobCode },
			)
		})
