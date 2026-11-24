// Reusable /ui-check capture script. It is not part of the E2E suite (the E2E
// pattern is cypress/e2e/**), so CI never runs it. Run it with the emulators
// seeded; see .claude/skills/ui-check/SKILL.md. Each capture starts from the
// seed data, so it gives the same images alone, filtered or in a full run.
//
//   UI_CHECK=true    selects this script instead of the E2E suite
//   UI_CHECK_LABEL   prefix for the screenshot names (for example `main` or `branch`)
//   UI_CHECK_WIDTHS  comma-separated viewport widths (default 390,1280), then
//                    `;part=widths` per capture (see cypress/ui-check/selection.js)
//   UI_CHECK_ONLY    comma-separated parts of capture ids or titles to run (for
//                    example `city-filter`); cypress/impact.js names each capture.
//                    It keeps the label's other captures and retakes its own
import { API_DATABASE } from '../../src/constants/api'
import { MOCK_THREADS } from '../../src/constants/test/mock-data/mock-messages'
import { conversationId } from '../../src/utils/conversationId'
import {
	ACCOUNT_MENU_SELECTORS,
	ACCOUNT_PAGE_SELECTORS,
	AUTHENTICATION_FORM_SELECTORS,
	AUTH_ACTION_PAGE_SELECTORS,
	CHANGE_EMAIL_FORM_SELECTORS,
	CHANGE_PASSWORD_FORM_SELECTORS,
	COMBOBOX_SELECTORS,
	COMMON_SELECTORS,
	CONVERSATION_ROW_SELECTORS,
	CONVERSATION_SKELETON_SELECTORS,
	DIALOG_SELECTORS,
	EDIT_TRIP_SELECTORS,
	ERROR_SUMMARY_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	FOOTER_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
	MESSAGES_PAGE_SKELETON_SELECTORS,
	MESSAGE_BUBBLE_SELECTORS,
	MESSAGE_THREAD_SELECTORS,
	NEW_PASSWORD_FORM_SELECTORS,
	PASSWORD_RESET_FORM_SELECTORS,
	PUBLIC_TRAVELLER_ITEM_SELECTORS,
	REPLY_BOX_SELECTORS,
	TAB_BAR_SELECTORS,
	THREAD_HEADER_SELECTORS,
	THREAD_NOTE_SELECTORS,
	TOAST_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
	TRAVELLERS_PAGE_SKELETON_SELECTORS,
	TRAVELLERS_WELCOME_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
	TRAVELLER_FILTER_SELECTORS,
	TRAVELLER_ITEM_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	TRIP_PHOTOS_SELECTORS,
	VERIFY_EMAIL_INBOX_SELECTORS,
	VERIFY_EMAIL_NOTE_SELECTORS,
	VERIFY_EMAIL_STRIP_SELECTORS,
} from '../../src/constants/test/selectors/components'
import {
	PAGE_NOT_FOUND_SELECTORS,
	PAGE_SELECTORS,
} from '../../src/constants/test/selectors/pages'
import { PATHS } from '../../src/constants/ui/paths'
import { GLOBAL } from '../../src/constants/ui/global'
import { sdkSessionOf } from '../support/utils/authHelpers'
import { TEST_USERS } from '../../src/constants/config/users'
import {
	EDIT_TRIP_CONFIG,
	TRAVELLER_REGISTRATION_SUCCESS_MESSAGE,
} from '../../src/constants/travellers'

import { hasSdkSession, performLogin } from '../support/utils/authHelpers'
import { shows } from '../support/utils/waitForSuccess'

import { CAPTURES } from '../impact'
import {
	onlyHashDiffers,
	parseOnly,
	parseWidthSpec,
	runsCapture,
	widthsFor,
} from './selection'

const LABEL = Cypress.expose('UI_CHECK_LABEL') || 'capture'
const WIDTH_SPEC = parseWidthSpec(Cypress.expose('UI_CHECK_WIDTHS'))
const ONLY = parseOnly(Cypress.expose('UI_CHECK_ONLY'))
// A filtered run overwrites its own shots rather than adding `name (1).png` beside them
const SCREENSHOT = { overwrite: true }
// The lightbox fills the screen; a full-page shot hides the scrollbar and widens its photo track without a re-snap, which a real resize never does
const LIGHTBOX_SHOT = { capture: 'viewport' }
const HEIGHT = 900
const BROKEN_IMAGE_ID = 'ui-check-broken-image'
const BROKEN_IMAGE_URL = 'http://localhost:1/unreachable.png'
const TIMEOUT = 10000
const PHOTOS_ID = 'ui-check-photo-states'
const PHOTO_HOST = 'http://ui-check.invalid'
const SLOW_PHOTO_URL = `${PHOTO_HOST}/slow-photo.svg`

// Served through an intercept: Chrome treats data: URLs as cached and then prefers the largest srcset candidate
const photoSvgs = {}
const svgPhoto = (label, colour, width, height) => {
	const url = `${PHOTO_HOST}/${label.toLowerCase()}-${colour.slice(1)}-${width}x${height}.svg`
	photoSvgs[url] =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${colour}"/><text x="50%" y="50%" font-size="${Math.min(width, height) / 4}" text-anchor="middle" dominant-baseline="middle" fill="#fff">${label}</text></svg>`
	return url
}

// Thumbnails keep the photo's ratio with their shortest side at the thumbnail width
const photoWithThumbnails = (colour, width, height) => {
	const short = Math.min(width, height)
	return {
		file: svgPhoto('FULL', colour, width, height),
		thumbnails: [320, 640].map((size) => ({
			width: size,
			url: svgPhoto(
				String(size),
				colour,
				Math.round((width / short) * size),
				Math.round((height / short) * size),
			),
		})),
	}
}

const landscape = photoWithThumbnails('#1d4ed8', 1600, 1200)
const portrait = photoWithThumbnails('#047857', 900, 1600)
const panorama = photoWithThumbnails('#b45309', 1920, 480)
const square = photoWithThumbnails('#0e7490', 1200, 1200)

const PHOTO_STATES = {
	files: [
		landscape.file,
		portrait.file,
		svgPhoto('LEGACY', '#6d28d9', 640, 480),
		svgPhoto('ORIGINAL', '#be123c', 640, 480),
		SLOW_PHOTO_URL,
		panorama.file,
		square.file,
	],
	fileThumbnails: [
		landscape.thumbnails,
		portrait.thumbnails,
		null,
		[{ width: 320, url: BROKEN_IMAGE_URL }],
		null,
		panorama.thumbnails,
		square.thumbnails,
	],
}

// Seen only during captures, never in the CI E2E suite, and its stack runs
// through $Cypress.pause, so it is tooling noise. Match that exact text only
Cypress.on('uncaught:exception', (error) => {
	if (error.message.includes('Cannot commit the same tree as before')) {
		return false
	}
})

// Set as each capture starts; its shots go in a folder named after it, so a filtered run replaces exactly its own
let currentCapture = null
const shotName = (name) => `${LABEL}/${currentCapture}/${name}`

// Every call site asserts the content first; the helper only names the file
const shot = (name, options = {}) => {
	// eslint-disable-next-line cypress/assertion-before-screenshot
	cy.screenshot(shotName(name), {
		...SCREENSHOT,
		capture: 'fullPage',
		...options,
	})
}

// Records each card's photo-row top, grouped by grid row, beside the shots: cards side by side should share one top
const TRAVELLER_CARD = `${TRAVELLER_ITEM_SELECTORS.ROOT}, ${PUBLIC_TRAVELLER_ITEM_SELECTORS.ROOT}`
const recordPhotoRows = (name) =>
	cy.get(TRAVELLER_CARD).then(($cards) => {
		const rows = {}
		;[...$cards].forEach((card) => {
			const photos = card.querySelector('ul')
			if (!photos) return
			const rowTop = Math.round(card.getBoundingClientRect().top)
			;(rows[rowTop] ??= []).push(
				Math.round(photos.getBoundingClientRect().top - rowTop),
			)
		})
		cy.writeFile(
			`cypress/ui-check-captures/capture.cy.js/${shotName(name)}-photo-rows.json`,
			rows,
		)
	})

// cy.visit keeps the page when only the hash differs, so reload to start the app afresh
const visit = (path) =>
	cy.url({ log: false }).then((current) => {
		cy.visit(path)
		if (onlyHashDiffers(current, path)) cy.reload()
	})

// times: 1, so a stub for a failure never also answers the real request after it
const interceptOnce = (method, url, response) =>
	cy.intercept({ method, url, times: 1 }, response)

// Freezes CSS animation (the spinner and the progress bar's fill too) and the text caret so a capture is never a random frame
const freezeAnimation = () => {
	cy.document().then((doc) => {
		const style = doc.createElement('style')
		style.textContent =
			'*, *::before, *::after, ::-webkit-progress-value { animation: none !important; transition: none !important; caret-color: transparent !important; }'
		doc.head.appendChild(style)
	})
}

// Queued with cy.then so it runs after the commands before it, not at spec load
const cdp = (command, params = {}) =>
	cy.then(() =>
		Cypress.automation('remote:debugger:protocol', { command, params }),
	)

// Cypress cannot hover, so force the pseudo-state through CDP (Chromium only).
// The automation target is the runner page, so reach the element through the app's iframe
// A visually hidden checkbox is scrolled to the very top of its list by scrollIntoView, clipping its chip, so it can opt out
const forcePseudo = (selector, states, { scroll = true } = {}) => {
	if (scroll) cy.get(selector).first().scrollIntoView()
	cdp('DOM.enable')
		.then(() => cdp('CSS.enable'))
		.then(() => cdp('DOM.getDocument', { depth: 0 }))
		.then(() =>
			cdp('Runtime.evaluate', {
				expression: `(document.querySelector(${JSON.stringify(selector)}) ?? document.querySelector('iframe.aut-iframe')?.contentDocument.querySelector(${JSON.stringify(selector)}))`,
			}),
		)
		.then(({ result }) => {
			if (!result.objectId) {
				throw new Error(`No node for ${selector}`)
			}
			return cdp('DOM.requestNode', { objectId: result.objectId })
		})
		.then(({ nodeId }) =>
			cdp('CSS.forcePseudoState', {
				nodeId,
				forcedPseudoClasses: states,
			}),
		)
}

// As the emulator's owner, so setup reads and writes pass the rules that keep traveller records behind sign-in
const emulatorDatabase = (path) =>
	`${Cypress.expose('VITE_DATABASE_URL')}/${path}.json?ns=${Cypress.expose('VITE_DATABASE_NAMESPACE')}&access_token=owner`

// Email-link accounts are made through the Auth emulator's REST API, so each width gets fresh ones and no seeded password changes
const AUTH_REST = Cypress.expose('API_URL')
const AUTH_EMULATOR = new URL(AUTH_REST).origin
const NEW_PASSWORD = 'capture-password'
const authRest = (method, body) =>
	cy
		.request(
			'POST',
			`${AUTH_REST}${method}?key=${Cypress.expose('API_KEY')}`,
			body,
		)
		.its('body')
const newAccount = (name) => {
	const email = `${name}-${Date.now()}@example.com`
	return authRest('signUp', {
		email,
		password: NEW_PASSWORD,
		returnSecureToken: true,
	}).then(({ idToken }) => ({ email, idToken }))
}
const sendVerifyLink = ({ idToken }) =>
	authRest('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken })
const latestOobCode = (email, requestType) =>
	cy
		.request(
			`${AUTH_EMULATOR}/emulator/v1/projects/${Cypress.expose('FIREBASE_PROJECT_ID')}/oobCodes`,
		)
		.its('body.oobCodes')
		.then(
			(codes) =>
				codes
					.filter(
						(code) =>
							code.email === email &&
							code.requestType === requestType,
					)
					.at(-1).oobCode,
		)
const actionPath = (mode, code) =>
	`${PATHS.AUTH_ACTION}?mode=${mode}&oobCode=${code}`
const ACTION_TITLE = `${AUTH_ACTION_PAGE_SELECTORS.TITLE}, ${NEW_PASSWORD_FORM_SELECTORS.TITLE}`
const INBOX = VERIFY_EMAIL_INBOX_SELECTORS
// The browser retries a POST whose connection drops, so a one-shot network error is answered by the retry; this fails every attempt while it is on
const networkDown = { on: false }
const failWhileDown = (url) =>
	cy.intercept({ method: API_DATABASE.POST, url }, (req) => {
		if (networkDown.on) req.destroy()
	})
const networkShot = (path, name) => {
	cy.then(() => {
		networkDown.on = true
	})
	visit(path)
	cy.get(AUTH_ACTION_PAGE_SELECTORS.TRY_AGAIN, { timeout: TIMEOUT }).should(
		'be.visible',
	)
	freezeAnimation()
	shot(name)
	cy.then(() => {
		networkDown.on = false
	})
}

const actionShot = (path, title, name) => {
	visit(path)
	cy.get(ACTION_TITLE, { timeout: TIMEOUT }).should('have.text', title)
	cy.get(COMMON_SELECTORS.BASE_SPINNER).should('not.exist')
	freezeAnimation()
	shot(name)
}

const ownTripPath = `${PATHS.TRAVELLERS}/${TEST_USERS.TRAVELLER.ID}`
const editTripPath = `${ownTripPath}/edit`

// The emulator's owner token passes the rules, for state no user could set
const OWNER = { Authorization: 'Bearer owner' }

// Noon, so "2 h ago" stays on the same day; never later than now, or the app would see its session token as expired
const NOW = (() => {
	const noon = new Date()
	if (noon.getHours() < 12) noon.setDate(noon.getDate() - 1)
	noon.setHours(12, 0, 0, 0)
	return noon.getTime()
})()

const LONG_MESSAGE =
	'Hi! We are heading to Kyoto in late March and your photos of the Philosopher’s Path were the reason we booked. Could you tell us which end you started from, and whether early morning was quiet enough for photos without crowds? Also, was the ryokan near Nanzen-ji worth the price, or would you stay closer to Gion next time? Any tips on the day trip to Nara would be lovely too. Thank you so much for sharing all of this.'

const ME = TEST_USERS.TRAVELLER.ID
const OTHER = TEST_USERS.OTHER_TRAVELLER.ID
const OTHER_CID = conversationId(ME, OTHER)
const UNKNOWN_ID = 'capture-unknown-traveller'
const UNKNOWN_CID = conversationId(ME, UNKNOWN_ID)
const threadPath = (cid) => `${PATHS.MESSAGES}/${cid}`
const OTHER_NAME = 'Jane Smith'
// Messages is a list beside the open thread from 1024px; below it, the list and the thread are separate screens
const isSplit = (width) => width >= 1024

// Opening a thread marks it read, so each width puts the unread state back first
const markUnread = () =>
	cy.request({
		method: 'PATCH',
		url: emulatorDatabase(`userConversations/${ME}/${OTHER_CID}`),
		headers: OWNER,
		body: { readAt: null },
	})

const openThread = (cid) => {
	visit(threadPath(cid))
	cy.get(MESSAGES_PAGE_SELECTORS.THREAD_CARD).should('be.visible')
	cy.get(THREAD_HEADER_SELECTORS.NAME, { timeout: TIMEOUT }).should('exist')
}

// The account button can render before the restored session fills in the name, so a traveller's page is not settled until it shows
const assertSignedInName = () =>
	cy.window({ log: false }).then((win) => {
		const uid = sdkSessionOf(win).userId
		if (!uid) return
		cy.request({
			url: emulatorDatabase(`travellers/${uid}`),
			headers: OWNER,
			log: false,
		}).then(({ body }) => {
			if (!body?.firstName) return
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON, {
				timeout: TIMEOUT,
			})
				.should('have.attr', 'aria-label')
				.and('contain', body.firstName)
		})
	})

// Seeded photos load over the network from the Storage emulator, so a capture could catch one half-painted, and a full-page capture scrolls lazy ones in only as it goes. So every image loads now; the deliberately held photo is left out
const assertImagesLoaded = () =>
	cy
		.document({ log: false })
		.then((doc) => {
			for (const image of doc.images) image.loading = 'eager'
		})
		.document({ log: false, timeout: TIMEOUT })
		.should((doc) => {
			const loading = [...doc.images]
				.filter((image) => !image.complete)
				.map((image) => image.currentSrc || image.src)
				.filter((url) => url !== SLOW_PHOTO_URL)
			expect(
				loading.length,
				`images still loading: ${loading.join(' ')}`,
			).to.equal(0)
		})
		.then((doc) =>
			Promise.all(
				[...doc.images]
					.filter((image) => image.naturalWidth)
					.map((image) => image.decode().catch(() => null)),
			),
		)

const assertSettled = () => {
	cy.get(COMMON_SELECTORS.BASE_SPINNER).should('not.exist')
	cy.get(TRAVELLERS_LIST_SELECTORS.LOADING, { timeout: TIMEOUT }).should(
		'not.exist',
	)
	cy.get(TRAVELLERS_LIST_SELECTORS.SKELETON_LIST, {
		timeout: TIMEOUT,
	}).should('not.exist')
	;[
		CONVERSATION_SKELETON_SELECTORS.LIST,
		CONVERSATION_SKELETON_SELECTORS.THREAD,
		CONVERSATION_SKELETON_SELECTORS.HEADER,
	].forEach((selector) =>
		cy.get(selector, { timeout: TIMEOUT }).should('not.exist'),
	)
	assertSignedInName()
	assertImagesLoaded()
}

// A step can add travellers, so a card it needs can sit beyond the first page
const showAllTravellers = () => {
	cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM, {
		timeout: TIMEOUT,
	}).should('exist')
	cy.get('body').then(($body) => {
		if ($body.find(TRAVELLERS_LIST_SELECTORS.SHOW_MORE).length) {
			cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE).click()
			showAllTravellers()
		}
	})
}

const eachWidth = (callback) => {
	widthsFor(
		WIDTH_SPEC,
		currentCapture,
		CAPTURES[currentCapture].title,
	).forEach((width) => {
		cy.viewport(width, HEIGHT)
		callback(width)
	})
}

// The page's code and its data held back: the route's skeleton first, then, once the code arrives, the page's own loading state, which should look the same. Literal selectors keep the script loadable on main, which lacks them
const PAGE_SKELETON = {
	travellers: TRAVELLERS_PAGE_SKELETON_SELECTORS.ROOT,
	messages: MESSAGES_PAGE_SKELETON_SELECTORS.ROOT,
}
const fallbackThenLoading = ({ path, chunk, data, loading, name }) => {
	// Requests for the page's code wait here until the shot of the fallback is taken; a held request fails at the command timeout, so it is raised for the capture
	const commandTimeout = Cypress.config('defaultCommandTimeout')
	Cypress.config('defaultCommandTimeout', TIMEOUT)
	const waiting = []
	let isHolding = true
	cy.intercept('GET', `**/assets/${chunk}-*.js`, () =>
		isHolding ? new Promise((resolve) => waiting.push(resolve)) : undefined,
	)
	cy.intercept('GET', data, (request) =>
		request.on('response', (response) => response.setDelay(60000)),
	)
	eachWidth((width) => {
		cy.then(() => {
			isHolding = true
		})
		visit(path)
		cy.get(PAGE_SKELETON[name]).should('be.visible')
		// The header's nav is lazy too, so the shot waits for it rather than catching it mid-load
		cy.window({ log: false }).then((win) => {
			if (sdkSessionOf(win).userId) {
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON, {
					timeout: TIMEOUT,
				}).should('exist')
			}
		})
		assertSignedInName()
		freezeAnimation()
		shot(`${name}-fallback-${width}`)
		cy.then(() => {
			isHolding = false
			waiting.splice(0).forEach((release) => release())
		})
		cy.get(PAGE_SKELETON[name], {
			timeout: TIMEOUT,
		}).should('not.exist')
		cy.get(loading).should('be.visible')
		freezeAnimation()
		shot(`${name}-loading-after-fallback-${width}`)
	})
	cy.then(() => Cypress.config('defaultCommandTimeout', commandTimeout))
}

// Skipped rather than left out, so the run lists what UI_CHECK_ONLY filtered away
const capture = (id, test) => {
	const entry = CAPTURES[id]
	if (!entry) throw new Error(`Add capture "${id}" to cypress/impact.js`)
	;(runsCapture(ONLY, id, entry.title) ? it : it.skip)(entry.title, () => {
		currentCapture = id
		cy.task('clearUiCheckScreenshots', { label: LABEL, capture: id })
		test()
	})
}

describe(`UI check capture (${LABEL})`, () => {
	// A full seed once per run: cy.session then keeps each role signed in across the tests
	before(() => {
		// A filtered run rechecks a few tests, so the label's other shots stay for the comparison
		if (!ONLY.length) cy.task('clearUiCheckScreenshots', { label: LABEL })
		cy.task('seedEmulators', { now: NOW })
		Cypress.session.clearAllSavedSessions()
	})

	// Back to the seed data before every capture, so no capture sees what an earlier one wrote. Only the database, unless a capture deleted an account
	beforeEach(() => {
		cy.task('resetEmulatorData', { now: NOW }).then(({ reseeded }) => {
			if (reseeded) Cypress.session.clearAllSavedSessions()
		})
	})

	// A failed test must not leave the slowed network or a device scale on for the next one
	afterEach(() => {
		cdp('Emulation.clearDeviceMetricsOverride')
		cdp('Network.emulateNetworkConditions', {
			offline: false,
			latency: 0,
			downloadThroughput: -1,
			uploadThroughput: -1,
		})
	})

	context('public pages', () => {
		capture('public-pages', () => {
			;[
				[
					'authentication',
					PATHS.AUTHENTICATION,
					PAGE_SELECTORS.AUTHENTICATION_MAIN_CONTAINER,
				],
				[
					'privacy',
					PATHS.PRIVACY,
					PAGE_SELECTORS.PRIVACY_MAIN_CONTAINER,
				],
				[
					'not-found',
					PATHS.NON_EXISTENT_PATH,
					PAGE_SELECTORS.PAGE_NOT_FOUND_MAIN_CONTAINER,
				],
			].forEach(([name, path, container]) => {
				eachWidth((width) => {
					visit(path)
					cy.get(container).should('be.visible')
					assertSettled()
					freezeAnimation()
					shot(`${name}-${width}`)
				})
			})
		})

		capture('auth-form-states', () => {
			const {
				EMAIL_INPUT,
				PASSWORD_INPUT,
				PASSWORD_ERROR_MESSAGE,
				LOGIN_SIGNUP_SUBMIT_BUTTON,
				LOGIN_SIGNUP_TOGGLE_LINK,
				FORGOT_PASSWORD_LINK,
				PASSWORD_TOGGLE,
			} = AUTHENTICATION_FORM_SELECTORS
			eachWidth((width) => {
				visit(PATHS.AUTHENTICATION)
				cy.get(LOGIN_SIGNUP_SUBMIT_BUTTON).click()
				cy.get(EMAIL_INPUT).should('have.attr', 'aria-invalid', 'true')
				cy.get(EMAIL_INPUT).should('have.focus')
				freezeAnimation()
				shot(`login-errors-${width}`)

				cy.get(LOGIN_SIGNUP_TOGGLE_LINK).click()
				cy.get(EMAIL_INPUT).type('not-an-email')
				cy.get(PASSWORD_INPUT).type('short')
				cy.get(PASSWORD_TOGGLE).click()
				cy.get(PASSWORD_INPUT).should('have.attr', 'type', 'text')
				cy.get(LOGIN_SIGNUP_SUBMIT_BUTTON).click()
				cy.get(PASSWORD_ERROR_MESSAGE).should('be.visible')
				shot(`signup-errors-password-shown-${width}`)

				visit(PATHS.AUTHENTICATION)
				cy.get(FORGOT_PASSWORD_LINK).click()
				cy.get(PASSWORD_RESET_FORM_SELECTORS.ROOT).should('be.visible')
				freezeAnimation()
				shot(`password-reset-${width}`)

				cy.get(PASSWORD_RESET_FORM_SELECTORS.SUBMIT).click()
				cy.get(PASSWORD_RESET_FORM_SELECTORS.EMAIL_ERROR).should(
					'be.visible',
				)
				shot(`password-reset-error-${width}`)

				cy.get(PASSWORD_RESET_FORM_SELECTORS.EMAIL_INPUT).type(
					TEST_USERS.TRAVELLER.EMAIL,
				)
				cy.get(PASSWORD_RESET_FORM_SELECTORS.SUBMIT).click()
				cy.get(PASSWORD_RESET_FORM_SELECTORS.SENT, {
					timeout: TIMEOUT,
				}).should('be.visible')
				shot(`password-reset-sent-${width}`)

				visit(PATHS.AUTHENTICATION)
				interceptOnce(API_DATABASE.POST, '**/*signInWithPassword*', {
					statusCode: 500,
					body: {},
					delay: 60000,
				})
				cy.get(EMAIL_INPUT).type(TEST_USERS.TRAVELLER.EMAIL)
				cy.get(PASSWORD_INPUT).type('not-checked-while-pending')
				cy.get(LOGIN_SIGNUP_SUBMIT_BUTTON).click()
				cy.get(FORGOT_PASSWORD_LINK).should('be.disabled')
				cy.get(LOGIN_SIGNUP_TOGGLE_LINK).should('be.disabled')
				freezeAnimation()
				shot(`login-busy-${width}`)
			})
		})
	})

	context('email verification', () => {
		capture('verify-inbox', () => {
			const { EMAIL_INPUT, PASSWORD_INPUT, LOGIN_SIGNUP_SUBMIT_BUTTON } =
				AUTHENTICATION_FORM_SELECTORS
			eachWidth((width) => {
				// Each width signs up a new account, so the last width's must be signed out: the login page restores Check your inbox for a signed-in, unverified account
				cy.clearAllLocalStorage()
				visit(
					`${PATHS.AUTHENTICATION}?mode=${API_DATABASE.AUTH_SIGNUP_MODE}`,
				)
				const email = `inbox-${width}-${Date.now()}@example.com`
				cy.get(EMAIL_INPUT).type(email)
				cy.get(PASSWORD_INPUT).type(NEW_PASSWORD)
				cy.get(LOGIN_SIGNUP_SUBMIT_BUTTON).click()
				cy.get(INBOX.ROOT, { timeout: TIMEOUT }).should('be.visible')
				cy.focused().should('have.text', 'Check your inbox')
				freezeAnimation()
				shot(`sent-${width}`)

				// A reload any sooner than the SDK storing the session logs the account out
				cy.window({ timeout: TIMEOUT }).should((win) => {
					expect(hasSdkSession({ ...win.localStorage }, email)).to.be
						.true
				})
				cy.reload()
				cy.get(INBOX.STATUS, { timeout: TIMEOUT }).should(
					'contain',
					email,
				)
				freezeAnimation()
				shot(`reloaded-${width}`)

				interceptOnce(API_DATABASE.POST, '**/accounts:sendOobCode*', {
					statusCode: 400,
					body: { error: { message: 'TOO_MANY_ATTEMPTS_TRY_LATER' } },
				})
				cy.get(INBOX.SEND_AGAIN).click()
				cy.get(INBOX.ERROR).should('contain', 'Too many emails')
				shot(`too-many-${width}`)

				cy.get(INBOX.CHECK).click()
				cy.get(INBOX.ERROR).should('contain', 'not verified yet')
				shot(`not-yet-${width}`)

				cy.get(INBOX.SEND_AGAIN).click()
				cy.get(INBOX.STATUS).should('contain', 'another link')
				shot(`resent-cooldown-${width}`)

				interceptOnce(API_DATABASE.POST, '**/accounts:lookup*', {
					statusCode: 500,
					body: {},
					delay: 60000,
				})
				cy.get(INBOX.CHECK).click()
				cy.get(INBOX.CHECK).should('have.attr', 'aria-busy', 'true')
				freezeAnimation()
				shot(`checking-${width}`)
			})
		})

		capture('verify-gate', () => {
			const STRIP = VERIFY_EMAIL_STRIP_SELECTORS.ROOT
			const NOTE = VERIFY_EMAIL_NOTE_SELECTORS.ROOT
			const settledShot = (name) => {
				assertSettled()
				freezeAnimation()
				shot(name)
			}

			eachWidth((width) => {
				// A new account made a traveller with a thread past the rules, as one made before verification was asked for would be
				const email = `gate-${width}-${Date.now()}@example.com`
				authRest('signUp', {
					email,
					password: NEW_PASSWORD,
					returnSecureToken: true,
				}).then(({ localId }) => {
					const cid = conversationId(localId, OTHER)
					cy.request({
						method: 'PATCH',
						url: emulatorDatabase(''),
						headers: OWNER,
						body: {
							[`travellers/${localId}`]: {
								firstName: 'Amara',
								lastName: 'Okafor',
								tripDescription:
									'Three days of tiles and trams.',
								cities: ['lisbon'],
								daysInCity: 3,
								registered: NOW,
							},
							[`conversations/${cid}/messages/-OGate000000000001`]:
								{
									senderId: OTHER,
									message:
										'Hi Amara, loved your Lisbon photos! Where was the sunset one?',
									createdAt: NOW - 60 * 60 * 1000,
								},
							[`userConversations/${localId}/${cid}`]: {
								otherId: OTHER,
								lastId: '-OGate000000000001',
								lastMessage:
									'Hi Amara, loved your Lisbon photos! Where was the sunset one?',
								lastSenderId: OTHER,
								lastAt: NOW - 60 * 60 * 1000,
							},
						},
					})
					performLogin(email, NEW_PASSWORD)

					visit(PATHS.TRAVELLERS)
					cy.get(STRIP, { timeout: TIMEOUT }).should('contain', email)
					settledShot(`strip-${width}`)
					forcePseudo(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN, [
						'focus',
						'focus-visible',
					])
					shot(`strip-focus-${width}`)
					forcePseudo(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN, [])
					// Scrolled into view, the strip sits under the sticky header, so its clicks start from the top

					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:sendOobCode*',
						{
							statusCode: 500,
							body: {},
							delay: 60000,
						},
					)
					cy.scrollTo('top')
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).click({
						scrollBehavior: false,
					})
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.BUSY).should(
						'be.visible',
					)
					freezeAnimation()
					shot(`strip-sending-${width}`)

					visit(PATHS.TRAVELLERS)
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN, {
						timeout: TIMEOUT,
					}).click()
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.MESSAGE).should(
						'contain',
						'Sent.',
					)
					settledShot(`strip-sent-${width}`)

					visit(PATHS.TRAVELLERS)
					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:sendOobCode*',
						{
							statusCode: 400,
							body: {
								error: {
									message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
								},
							},
						},
					)
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN, {
						timeout: TIMEOUT,
					}).click()
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.MESSAGE).should(
						'contain',
						'Not sent.',
					)
					settledShot(`strip-not-sent-${width}`)

					visit(PATHS.TRAVELLERS)
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.CHECK, {
						timeout: TIMEOUT,
					}).click({
						scrollBehavior: false,
					})
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.MESSAGE).should(
						'contain',
						'Not verified yet',
					)
					settledShot(`strip-not-yet-${width}`)

					visit(PATHS.REGISTER)
					cy.get(NOTE, { timeout: TIMEOUT }).should('contain', email)
					cy.get(STRIP).should('not.exist')
					settledShot(`register-${width}`)
					cy.get(VERIFY_EMAIL_NOTE_SELECTORS.SEND_AGAIN).click()
					cy.get(VERIFY_EMAIL_NOTE_SELECTORS.MESSAGE).should(
						'contain',
						'Sent.',
					)
					settledShot(`register-sent-${width}`)
					cy.get(VERIFY_EMAIL_NOTE_SELECTORS.CHECK).click()
					cy.get(VERIFY_EMAIL_NOTE_SELECTORS.MESSAGE).should(
						'contain',
						'Not verified yet',
					)
					settledShot(`register-not-yet-${width}`)

					visit(`${PATHS.TRAVELLERS}/${localId}/edit`)
					cy.get(NOTE, { timeout: TIMEOUT }).should('be.visible')
					settledShot(`edit-${width}`)

					visit(`${PATHS.MESSAGES}/${cid}`)
					cy.get(NOTE, { timeout: TIMEOUT }).should(
						'contain',
						'Verify your email to reply.',
					)
					cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('be.visible')
					settledShot(`thread-${width}`)
				})
			})
		})

		capture('account-settings', () => {
			const CURRENT =
				CHANGE_PASSWORD_FORM_SELECTORS.CURRENT_PASSWORD_INPUT
			const NEW = CHANGE_PASSWORD_FORM_SELECTORS.NEW_PASSWORD_INPUT
			const SAVE = CHANGE_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD
			const settledShot = (name) => {
				assertSettled()
				freezeAnimation()
				shot(name)
			}
			const openForm = () => {
				visit(PATHS.ACCOUNT)
				cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_PASSWORD, {
					timeout: TIMEOUT,
				}).click()
				cy.get(CHANGE_PASSWORD_FORM_SELECTORS.ROOT).should('be.visible')
			}
			const fill = (current, next) => {
				cy.get(CURRENT).type(current)
				cy.get(NEW).type(next)
			}

			eachWidth((width) => {
				performLogin()
				visit(PATHS.ACCOUNT)
				cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL, {
					timeout: TIMEOUT,
				}).should('have.text', TEST_USERS.STANDARD.EMAIL)
				settledShot(`verified-${width}`)

				// A fresh unverified account, so the saved password change touches no seeded login
				const email = `account-${width}-${Date.now()}@example.com`
				authRest('signUp', {
					email,
					password: NEW_PASSWORD,
					returnSecureToken: true,
				}).then(() => {
					performLogin(email, NEW_PASSWORD)

					visit(PATHS.ACCOUNT)
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL, {
						timeout: TIMEOUT,
					}).should('have.text', email)
					cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT).should(
						'not.exist',
					)
					settledShot(`unverified-${width}`)

					cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
					cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should(
						'contain',
						'Not verified',
					)
					forcePseudo(
						ACCOUNT_MENU_SELECTORS.ACCOUNT_SETTINGS,
						['focus', 'focus-visible'],
						{ scroll: false },
					)
					shot(`menu-unverified-${width}`, { capture: 'viewport' })
					forcePseudo(ACCOUNT_MENU_SELECTORS.ACCOUNT_SETTINGS, [], {
						scroll: false,
					})
					cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()

					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:sendOobCode*',
						{
							statusCode: 500,
							body: {},
							delay: 60000,
						},
					)
					cy.get(ACCOUNT_PAGE_SELECTORS.SEND_AGAIN).click()
					cy.get(ACCOUNT_PAGE_SELECTORS.SEND_AGAIN).should(
						'have.attr',
						'aria-busy',
						'true',
					)
					freezeAnimation()
					shot(`sending-${width}`)

					visit(PATHS.ACCOUNT)
					cy.get(ACCOUNT_PAGE_SELECTORS.SEND_AGAIN, {
						timeout: TIMEOUT,
					}).click()
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_MESSAGE).should(
						'contain',
						'Sent.',
					)
					settledShot(`sent-${width}`)

					openForm()
					settledShot(`password-open-${width}`)
					forcePseudo(CHANGE_PASSWORD_FORM_SELECTORS.CANCEL, [
						'focus',
						'focus-visible',
					])
					shot(`password-cancel-focus-${width}`)
					forcePseudo(CHANGE_PASSWORD_FORM_SELECTORS.CANCEL, [])

					cy.get(SAVE).click()
					cy.get(
						CHANGE_PASSWORD_FORM_SELECTORS.CURRENT_PASSWORD_ERROR,
					).should('be.visible')
					settledShot(`password-empty-${width}`)

					cy.get(CURRENT).type('not-the-password')
					cy.get(NEW).type('abc').blur()
					cy.get(
						CHANGE_PASSWORD_FORM_SELECTORS.NEW_PASSWORD_ERROR,
					).should('contain', '6 characters')
					settledShot(`password-short-${width}`)

					openForm()
					fill('not-the-password', 'another-password')
					cy.get(SAVE).click()
					cy.get(
						CHANGE_PASSWORD_FORM_SELECTORS.CURRENT_PASSWORD_ERROR,
						{ timeout: TIMEOUT },
					).should('contain', 'not right')
					settledShot(`password-wrong-${width}`)

					openForm()
					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:signInWithPassword*',
						{
							statusCode: 400,
							body: {
								error: {
									message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
								},
							},
						},
					)
					fill(NEW_PASSWORD, 'another-password')
					cy.get(SAVE).click()
					cy.get(CHANGE_PASSWORD_FORM_SELECTORS.ALERT, {
						timeout: TIMEOUT,
					}).should('contain', 'Too many attempts')
					settledShot(`password-too-many-${width}`)

					openForm()
					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:signInWithPassword*',
						{ statusCode: 500, body: {}, delay: 60000 },
					)
					fill(NEW_PASSWORD, 'another-password')
					cy.get(SAVE).click()
					cy.get(SAVE).should('have.attr', 'aria-busy', 'true')
					freezeAnimation()
					shot(`password-saving-${width}`)

					openForm()
					fill(NEW_PASSWORD, 'capture-password-changed')
					cy.get(SAVE).click()
					cy.get(ACCOUNT_PAGE_SELECTORS.PASSWORD_CHANGED, {
						timeout: TIMEOUT,
					}).should('be.visible')
					cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_PASSWORD).should(
						'have.focus',
					)
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL).should(
						'have.text',
						email,
					)
					settledShot(`password-changed-${width}`)
				})
			})
		})

		capture('change-email', () => {
			const NEW = CHANGE_EMAIL_FORM_SELECTORS.NEW_EMAIL_INPUT
			const CURRENT = CHANGE_EMAIL_FORM_SELECTORS.CURRENT_PASSWORD_INPUT
			const SEND = CHANGE_EMAIL_FORM_SELECTORS.SEND_LINK
			const settledShot = (name) => {
				assertSettled()
				freezeAnimation()
				shot(name)
			}
			const openForm = () => {
				visit(PATHS.ACCOUNT)
				cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_EMAIL, {
					timeout: TIMEOUT,
				}).click()
				cy.get(NEW).should('be.visible')
			}
			const fill = (email, password) => {
				cy.get(NEW).type(email)
				cy.get(CURRENT).type(password)
			}

			eachWidth((width) => {
				performLogin()
				openForm()
				settledShot(`open-${width}`)

				cy.get(SEND).click()
				cy.get(
					CHANGE_EMAIL_FORM_SELECTORS.CURRENT_PASSWORD_ERROR,
				).should('be.visible')
				settledShot(`empty-${width}`)

				cy.get(NEW).clear().type(TEST_USERS.STANDARD.EMAIL)
				cy.get(SEND).click()
				cy.get(CHANGE_EMAIL_FORM_SELECTORS.NEW_EMAIL_ERROR).should(
					'contain',
					'already your email',
				)
				settledShot(`same-${width}`)

				openForm()
				fill(`new-${width}@example.org`, 'not-the-password')
				cy.get(SEND).click()
				cy.get(CHANGE_EMAIL_FORM_SELECTORS.CURRENT_PASSWORD_ERROR, {
					timeout: TIMEOUT,
				}).should('contain', 'not right')
				settledShot(`wrong-${width}`)

				// A fresh account, so the real link sent below changes no seeded login
				newAccount(`change-${width}`).then(({ email }) => {
					performLogin(email, NEW_PASSWORD)

					openForm()
					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:sendOobCode*',
						{
							statusCode: 400,
							body: { error: { message: 'EMAIL_EXISTS' } },
						},
					)
					fill(`taken-${width}@example.org`, NEW_PASSWORD)
					cy.get(SEND).click()
					cy.get(CHANGE_EMAIL_FORM_SELECTORS.ALERT, {
						timeout: TIMEOUT,
					}).should('contain', 'cannot be used')
					settledShot(`taken-${width}`)

					openForm()
					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:sendOobCode*',
						{ statusCode: 500, body: {}, delay: 60000 },
					)
					fill(`new-${width}@example.org`, NEW_PASSWORD)
					cy.get(SEND).click()
					cy.get(SEND).should('have.attr', 'aria-busy', 'true')
					freezeAnimation()
					shot(`sending-${width}`)

					openForm()
					fill(`new-${width}@example.org`, NEW_PASSWORD)
					cy.get(SEND).click()
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_SENT, {
						timeout: TIMEOUT,
					})
						.should('contain', `new-${width}@example.org`)
						.and('have.focus')
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL).should(
						'have.text',
						email,
					)
					settledShot(`sent-${width}`)

					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:sendOobCode*',
						{
							statusCode: 400,
							body: {
								error: {
									message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
								},
							},
						},
					)
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_SEND_AGAIN).click()
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_SENT_ERROR).should(
						'be.visible',
					)
					settledShot(`send-again-failed-${width}`)

					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_SEND_AGAIN).click()
					cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_SENT_HINT, {
						timeout: TIMEOUT,
					}).should('contain', 'seconds')
					freezeAnimation()
					shot(`send-again-resting-${width}`)
				})
			})
		})

		capture('auth-action-email-change', () => {
			eachWidth((width) => {
				newAccount(`changed-${width}`).then(({ email, idToken }) => {
					const newEmail = `changed-new-${width}-${Date.now()}@example.org`
					performLogin(email, NEW_PASSWORD)
					authRest('sendOobCode', {
						requestType: 'VERIFY_AND_CHANGE_EMAIL',
						idToken,
						newEmail,
					})
					latestOobCode(email, 'VERIFY_AND_CHANGE_EMAIL').then(
						(code) =>
							actionShot(
								actionPath('verifyAndChangeEmail', code),
								'Your email has changed',
								`changed-${width}`,
							),
					)

					// The Auth emulator never sends the old address its recover link, so that link's answers are stubbed
					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:resetPassword*',
						{
							email,
							newEmail,
							requestType: 'RECOVER_EMAIL',
						},
					)
					interceptOnce(API_DATABASE.POST, '**/accounts:update*', {
						email,
					})
					actionShot(
						actionPath('recoverEmail', 'capture-recover'),
						'Your email has been changed back',
						`recovered-${width}`,
					)
				})
			})
		})

		capture('auth-action', () => {
			failWhileDown('**/accounts:update*')
			failWhileDown('**/accounts:resetPassword*')
			eachWidth((width) => {
				// Signed in, not yet a traveller
				newAccount(`verify-${width}`).then((account) => {
					sendVerifyLink(account)
					performLogin(account.email, NEW_PASSWORD)
					latestOobCode(account.email, 'VERIFY_EMAIL').then(
						(code) => {
							actionShot(
								actionPath('verifyEmail', code),
								'Your email is verified',
								`verified-${width}`,
							)
							actionShot(
								actionPath('verifyEmail', code),
								'Your email is already verified',
								`already-verified-${width}`,
							)
						},
					)
				})

				// Signed in and unverified, with a used or old link
				newAccount(`expired-${width}`).then((account) => {
					performLogin(account.email, NEW_PASSWORD)
					interceptOnce(API_DATABASE.POST, '**/accounts:update*', {
						statusCode: 500,
						body: {},
						delay: 60000,
					})
					visit(actionPath('verifyEmail', 'capture-loading'))
					cy.contains(
						AUTH_ACTION_PAGE_SELECTORS.VIEW,
						'Checking your link',
						{
							timeout: TIMEOUT,
						},
					).should('be.visible')
					freezeAnimation()
					shot(`loading-${width}`)

					networkShot(
						actionPath('verifyEmail', 'capture-network'),
						`network-${width}`,
					)

					actionShot(
						actionPath('verifyEmail', 'capture-expired'),
						'This link has expired',
						`expired-${width}`,
					)
					interceptOnce(
						API_DATABASE.POST,
						'**/accounts:sendOobCode*',
						{
							statusCode: 400,
							body: {
								error: {
									message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
								},
							},
						},
					)
					cy.get(AUTH_ACTION_PAGE_SELECTORS.SEND_NEW_LINK).click()
					cy.get(AUTH_ACTION_PAGE_SELECTORS.ALERT).should(
						'be.visible',
					)
					shot(`expired-send-failed-${width}`)
					cy.get(AUTH_ACTION_PAGE_SELECTORS.SEND_NEW_LINK).click()
					cy.get(AUTH_ACTION_PAGE_SELECTORS.EXPIRED_SENT, {
						timeout: TIMEOUT,
					}).should('be.visible')
					shot(`expired-sent-${width}`)
				})

				// Signed out, as on another device
				newAccount(`signed-out-${width}`).then((account) => {
					sendVerifyLink(account)
					cy.clearLocalStorage()
					latestOobCode(account.email, 'VERIFY_EMAIL').then((code) =>
						actionShot(
							actionPath('verifyEmail', code),
							'Your email is verified',
							`verified-signed-out-${width}`,
						),
					)
					actionShot(
						actionPath('verifyEmail', 'capture-expired'),
						'This link has expired',
						`expired-signed-out-${width}`,
					)
					actionShot(
						PATHS.AUTH_ACTION,
						'This link is not valid',
						`invalid-${width}`,
					)
				})

				// Password reset
				newAccount(`reset-${width}`).then(({ email }) => {
					authRest('sendOobCode', {
						requestType: 'PASSWORD_RESET',
						email,
					})
					latestOobCode(email, 'PASSWORD_RESET').then((code) => {
						actionShot(
							actionPath('resetPassword', code),
							'Choose a new password',
							`reset-form-${width}`,
						)
						cy.get(
							NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD,
						).click()
						cy.get(
							NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT,
						).should('have.attr', 'aria-invalid', 'true')
						shot(`reset-error-${width}`)

						interceptOnce(
							API_DATABASE.POST,
							'**/accounts:resetPassword*',
							{ statusCode: 500, body: {}, delay: 60000 },
						)
						cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).type(
							NEW_PASSWORD,
						)
						cy.get(
							NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD,
						).click()
						cy.get(
							NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD,
						).should('have.attr', 'aria-busy', 'true')
						freezeAnimation()
						shot(`reset-saving-${width}`)

						actionShot(
							actionPath('resetPassword', code),
							'Choose a new password',
							`reset-form-again-${width}`,
						)
						cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).type(
							NEW_PASSWORD,
						)
						cy.get(
							NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD,
						).click()
						cy.get(ACTION_TITLE, { timeout: TIMEOUT }).should(
							'have.text',
							'Your password has been changed',
						)
						shot(`reset-done-${width}`)
					})
					actionShot(
						actionPath('resetPassword', 'capture-expired'),
						'This reset link has expired',
						`reset-expired-${width}`,
					)
					networkShot(
						actionPath('resetPassword', 'capture-network'),
						`reset-network-${width}`,
					)
				})
			})
		})
	})

	context('logged out', () => {
		capture('public-travellers', () => {
			const card = PUBLIC_TRAVELLER_ITEM_SELECTORS.ROOT
			const viewTrip = PUBLIC_TRAVELLER_ITEM_SELECTORS.VIEW_TRIP
			const band = TRAVELLERS_WELCOME_SELECTORS.ROOT
			const publicTrips = '**/publicTrips.json*'
			const seeded = () =>
				cy
					.request(emulatorDatabase('publicTrips'))
					.then(({ body }) => Object.values(body))

			const atRest = (name, width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(card, { timeout: TIMEOUT }).should('exist')
				cy.get(band).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`${name}-${width}`)
				recordPhotoRows(`${name}-${width}`)
			}

			eachWidth((width) => {
				cy.clearAllLocalStorage()
				atRest('public-travellers', width)

				// Hover and keyboard focus on the first card's only action
				forcePseudo(viewTrip, ['hover'])
				shot(`public-view-trip-hover-${width}`)
				forcePseudo(viewTrip, ['focus', 'focus-visible'])
				shot(`public-view-trip-focus-${width}`)
				forcePseudo(viewTrip, [])

				// Narrowed by city: the sheet at 768px and below, inline above
				cy.get('body').then(($body) => {
					if (
						$body.find(
							`${TRAVELLER_FILTER_SELECTORS.TRIGGER}:visible`,
						).length
					) {
						cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).click()
						cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
							.contains(
								TRAVELLER_FILTER_SELECTORS.OPTION,
								/prague/i,
							)
							.click()
						cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_MATCHES).click()
						cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should(
							'not.exist',
						)
					} else {
						cy.contains(
							TRAVELLER_FILTER_SELECTORS.OPTION,
							/prague/i,
						).click()
					}
				})
				cy.get(card).should('have.length', 1)
				shot(`public-travellers-narrowed-${width}`)

				// Held open, so the skeletons stay on screen beside the band
				interceptOnce('GET', publicTrips, (request) =>
					request.on('response', (response) =>
						response.setDelay(60000),
					),
				)
				cy.clearAllLocalStorage()
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.SKELETON_LIST).should(
					'be.visible',
				)
				// The route fallback has the same skeletons; the disabled Refresh is the page's own, so its load has started and taken the held reply
				cy.get(TRAVELLERS_LIST_SELECTORS.REFRESH_BUTTON).should(
					'be.disabled',
				)
				cy.get(band).should('be.visible')
				freezeAnimation()
				shot(`public-travellers-loading-${width}`)

				interceptOnce('GET', publicTrips, { statusCode: 500, body: {} })
				cy.clearAllLocalStorage()
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`public-travellers-error-${width}`)

				interceptOnce('GET', publicTrips, { body: null })
				cy.clearAllLocalStorage()
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.NO_PUBLIC_TRIPS).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`public-travellers-empty-${width}`)

				// The seeded summaries with the first photo pointed at an unreachable one, then cloned to 30 for paging
				seeded().then((trips) => {
					const [first, ...rest] = trips
					const broken = {
						...first,
						firstName: 'Broken',
						photos: [
							{ url: BROKEN_IMAGE_URL, alt: 'Unreachable' },
							...(first.photos ?? []).slice(1),
						],
					}
					interceptOnce('GET', publicTrips, {
						body: { 'ui-check-broken': broken },
					})
					cy.clearAllLocalStorage()
					visit(PATHS.TRAVELLERS)
					cy.get(card).should('have.length', 1)
					cy.contains(GLOBAL.IMAGE_UNAVAILABLE, {
						timeout: TIMEOUT,
					}).should('be.visible')
					freezeAnimation()
					shot(`public-travellers-broken-photo-${width}`)

					// The seeded excerpts are short, so one long enough to clamp beside a card with none
					interceptOnce('GET', publicTrips, {
						body: {
							'ui-check-long-excerpt': {
								...first,
								firstName: 'Long',
								tripExcerpt:
									'Eight slow days wandering the old town, the castle district and the river banks, with long lunches, late trams and a morning at the market. '
										.repeat(2)
										.slice(0, 200)
										.trim(),
							},
							'ui-check-no-excerpt': {
								...first,
								firstName: 'None',
								tripExcerpt: null,
							},
						},
					})
					cy.clearAllLocalStorage()
					visit(PATHS.TRAVELLERS)
					cy.get(card).should('have.length', 2)
					assertSettled()
					freezeAnimation()
					shot(`public-travellers-excerpt-${width}`)

					const many = Object.fromEntries(
						Array.from({ length: 30 }, (_, index) => [
							`ui-check-public-${String(index).padStart(2, '0')}`,
							{
								...[first, ...rest][index % trips.length],
								firstName: `Paged${index + 1}`,
							},
						]),
					)
					interceptOnce('GET', publicTrips, { body: many })
					cy.clearAllLocalStorage()
					visit(PATHS.TRAVELLERS)
					cy.get(card).should('have.length', 12)
					cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE).should(
						'be.visible',
					)
					assertSettled()
					freezeAnimation()
					shot(`public-travellers-many-${width}`)
				})

				// View trip lands on Log in, which names the trip
				cy.clearAllLocalStorage()
				visit(PATHS.TRAVELLERS)
				cy.get(viewTrip, { timeout: TIMEOUT }).first().click()
				cy.get(AUTHENTICATION_FORM_SELECTORS.NOTICE).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`public-login-from-trip-${width}`)
			})
		})

		capture('public-travellers-fallback', () => {
			cy.clearAllLocalStorage()
			fallbackThenLoading({
				path: PATHS.TRAVELLERS,
				chunk: 'Travellers',
				data: '**/publicTrips.json*',
				loading: TRAVELLERS_LIST_SELECTORS.SKELETON_LIST,
				name: 'travellers',
			})
		})
	})

	context('signed in as a standard user', () => {
		beforeEach(() => {
			performLogin()
		})

		capture('travellers-detail', () => {
			cy.request({
				method: 'PUT',
				url: emulatorDatabase(`travellers/${BROKEN_IMAGE_ID}`),
				headers: { Authorization: 'Bearer owner' },
				body: {
					firstName: 'Broken',
					lastName: 'Image',
					tripDescription:
						'A traveller whose photo URL is unreachable.',
					tripStart: '2024-12-28',
					tripEnd: '2025-01-03',
					cities: ['oslo'],
					files: [BROKEN_IMAGE_URL],
					fileDimensions: [{ width: 640, height: 480 }],
					registered: NOW,
				},
			})

			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
					'have.length.at.least',
					3,
				)
				assertSettled()
				// The real error path: the unreachable URL fires a genuine error event
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FALLBACK, {
					timeout: TIMEOUT,
				}).should('exist')
				freezeAnimation()
				shot(`travellers-${width}`)
				recordPhotoRows(`travellers-${width}`)

				cy.get(TRAVELLER_ITEM_SELECTORS.VIEW_TRIP).first().click()
				cy.get(TRAVELLER_DETAIL_SELECTORS.ROOT).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`traveller-detail-${width}`)
			})
		})

		capture('city-filter-many', () => {
			;[
				'oslo',
				'lima',
				'rome',
				'paris',
				'cairo',
				'tokyo',
				'prague',
				'berlin',
				'madrid',
				'vienna',
				'athens',
				'dublin',
				'warsaw',
				'zagreb',
				'sofia',
				'riga',
				'tallinn',
				'bern',
				'bruges',
				'porto',
				'seville',
				'florence',
			].forEach((city, index) => {
				cy.request({
					method: 'PUT',
					url: emulatorDatabase(
						`travellers/ui-check-many-cities-${index}`,
					),
					headers: { Authorization: 'Bearer owner' },
					body: {
						firstName: `Many${index}`,
						lastName: 'Cities',
						tripDescription: 'Seeded for the city filter.',
						daysInCity: 2,
						cities: [city],
						files: [BROKEN_IMAGE_URL],
						fileDimensions: [{ width: 640, height: 480 }],
						registered: NOW,
					},
				})
			})

			// Case-insensitive: main shows stored ids as they are ("oslo")
			const chip = (name) => [
				TRAVELLER_FILTER_SELECTORS.OPTION,
				new RegExp(name, 'i'),
			]

			const inlineStates = (width) => {
				cy.get(TRAVELLER_FILTER_SELECTORS.LIST).first().focus()
				shot(`city-filter-list-focus-${width}`)
				cy.get(TRAVELLER_FILTER_SELECTORS.SEARCH).first().type('o')
				cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).should('exist')
				shot(`city-filter-searched-${width}`)
				cy.contains(...chip('Oslo')).click()
				cy.get(TRAVELLER_FILTER_SELECTORS.STATUS).should(
					'contain',
					' of ',
				)
				shot(`city-filter-ticked-${width}`)
				cy.get(TRAVELLER_FILTER_SELECTORS.SEARCH)
					.first()
					.clear()
					.type('zzz')
				cy.get(TRAVELLER_FILTER_SELECTORS.EMPTY).should('be.visible')
				shot(`city-filter-empty-${width}`)
			}

			const sheetStates = (width) => {
				cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).click()
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should('be.visible')
				shot(`city-filter-sheet-${width}`)
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
					.contains(...chip('Oslo'))
					.click()
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
					.contains(...chip('Rome'))
					.click()
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
					.find(`${TRAVELLER_FILTER_SELECTORS.CHECKBOX}:checked`)
					.should('have.length', 2)
				shot(`city-filter-sheet-ticked-${width}`)
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
					.find(TRAVELLER_FILTER_SELECTORS.SEARCH)
					.type('o')
				shot(`city-filter-sheet-searched-${width}`)
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
					.find(TRAVELLER_FILTER_SELECTORS.SEARCH)
					.clear()
					.type('zzz')
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
					.find(TRAVELLER_FILTER_SELECTORS.EMPTY)
					.should('be.visible')
				shot(`city-filter-sheet-empty-${width}`)
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
					.find(TRAVELLER_FILTER_SELECTORS.SEARCH)
					.clear()
				forcePseudo(
					`${TRAVELLER_FILTER_SELECTORS.SHEET} ${TRAVELLER_FILTER_SELECTORS.CHECKBOX}`,
					['focus', 'focus-visible'],
				)
				shot(`city-filter-sheet-chip-focus-${width}`)
				forcePseudo(
					`${TRAVELLER_FILTER_SELECTORS.SHEET} ${TRAVELLER_FILTER_SELECTORS.CHECKBOX}`,
					[],
				)
				cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_MATCHES).click()
				cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should('not.exist')
				cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).should(
					'contain',
					'2 of',
				)
				shot(`city-filter-narrowed-${width}`)
			}

			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).should(
					'have.length.at.least',
					8,
				)
				assertSettled()
				freezeAnimation()
				shot(`city-filter-many-${width}`)

				// The branch swaps the inline filter for a sheet at 768px and below; main and wider screens keep it inline
				cy.get('body').then(($body) => {
					if (
						$body.find(
							`${TRAVELLER_FILTER_SELECTORS.TRIGGER}:visible`,
						).length
					) {
						sheetStates(width)
					} else if (
						$body.find(TRAVELLER_FILTER_SELECTORS.SEARCH).length
					) {
						inlineStates(width)
					}
				})
			})
		})

		capture('photo-states', () => {
			cy.request({
				method: 'PUT',
				url: emulatorDatabase(`travellers/${PHOTOS_ID}`),
				headers: { Authorization: 'Bearer owner' },
				body: {
					firstName: 'Photo',
					lastName: 'States',
					tripDescription:
						'Thumbnails, a legacy photo, a failing thumbnail and a slow photo.',
					tripStart: '2025-06-14',
					tripEnd: '2025-06-14',
					cities: ['lisbon'],
					...PHOTO_STATES,
					registered: NOW,
				},
			})
			// Held open so the solid placeholder stays on screen
			cy.intercept('GET', `${PHOTO_HOST}/*`, (request) => {
				const svg = {
					body:
						photoSvgs[request.url] ??
						'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"/>',
					headers: { 'content-type': 'image/svg+xml' },
				}
				// The square's tiles load from thumbnails, so only the lightbox meets its full photo failing
				if (request.url === square.file) {
					request.reply({ statusCode: 404 })
					return
				}
				request.reply(
					request.url === SLOW_PHOTO_URL
						? { ...svg, delay: 60000 }
						: svg,
				)
			})

			// Lazy tiles only load once scrolled to, and an unsettled tile is no evidence
			const tiles = (scope) => {
				const selector = `${scope} ${COMMON_SELECTORS.BASE_IMAGE_THUMBNAIL}`
				cy.get(scope).scrollIntoView()
				// Re-queried per tile, since a failing thumbnail re-renders its tile
				cy.get(selector)
					.its('length')
					.then((count) => {
						Cypress._.times(count, (index) => {
							cy.get(selector).eq(index).scrollIntoView()
							cy.get(selector)
								.eq(index)
								.should(($el) => {
									if ($el.attr('src') === SLOW_PHOTO_URL)
										return
									expect($el[0].complete).to.equal(true)
									expect(
										$el[0].naturalWidth,
									).to.be.greaterThan(0)
								})
						})
					})
				return cy.get(selector)
			}

			const assertSources = (scope, expected) =>
				tiles(scope).then(($imgs) => {
					expected.forEach((source, index) => {
						// The held photo has no current source until it loads
						const actual =
							source === SLOW_PHOTO_URL
								? $imgs[index].getAttribute('src')
								: $imgs[index].currentSrc
						expect(actual, `tile ${index}`).to.equal(source)
					})
				})

			const listItem = `${TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM}:has([data-cy]:contains("Photo States"))`
			const thumbnailList = (thumbnailSize) => {
				const pick = (photo) =>
					photo.thumbnails.find(
						({ width }) => width === thumbnailSize,
					).url
				return [
					pick(landscape),
					pick(portrait),
					PHOTO_STATES.files[2],
					// The broken thumbnail falls back to the original
					PHOTO_STATES.files[3],
				]
			}

			const capture = (suffix) => {
				visit(PATHS.TRAVELLERS)
				assertSettled()
				showAllTravellers()
				cy.get(listItem).should('have.length', 1)
				assertSources(
					listItem,
					thumbnailList(suffix === '2x' ? 640 : 320),
				)
				cy.get(
					`${listItem} ${TRAVELLER_ITEM_SELECTORS.SEE_ALL_LINK}`,
				).should('be.visible')
				freezeAnimation()
				// The seeded list is many screens long, so only this traveller is captured
				cy.get(listItem).screenshot(
					shotName(`photo-states-list-${suffix}`),
					SCREENSHOT,
				)

				visit(`${PATHS.TRAVELLERS}/${PHOTOS_ID}`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST).should(
					'be.visible',
				)
				assertSettled()
				const size = suffix === '2x' ? 640 : 320
				assertSources(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST, [
					...thumbnailList(size),
					SLOW_PHOTO_URL,
					panorama.thumbnails.find(({ width }) => width === size).url,
					square.thumbnails.find(({ width }) => width === size).url,
				])
				freezeAnimation()
				shot(`photo-states-detail-${suffix}`)
			}

			// The full-screen lightbox: focus, every kind of photo, loading, failed and one photo
			const lightboxStates = (width) => {
				const closeButton = '[role="dialog"] button[aria-label="Close"]'
				const settleOn = (position, count = 7) => {
					cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
						'have.text',
						`${position + 1} of ${count}`,
					)
					cy.get(COMMON_SELECTORS.IMAGE_GALLERY_TRACK).should(
						($track) =>
							expect(
								Math.abs(
									$track[0].scrollLeft -
										position * $track[0].clientWidth,
								),
							).to.be.lessThan(1),
					)
				}
				const next = (times) =>
					Cypress._.times(times, () =>
						cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).click(),
					)

				forcePseudo(closeButton, ['focus', 'focus-visible'], {
					scroll: false,
				})
				shot(`photo-states-lightbox-focus-${width}`, LIGHTBOX_SHOT)
				forcePseudo(closeButton, [], { scroll: false })

				// Mid swipe down: the photo follows the finger and the backdrop fades; a last move that goes nowhere makes the release slow, so it springs back
				if (width < 768) {
					const touchAt = (type, clientY) =>
						cy
							.get(COMMON_SELECTORS.IMAGE_GALLERY_STAGE)
							.trigger(type, {
								touches:
									type === 'touchend'
										? []
										: [{ clientX: 200, clientY }],
								changedTouches: [{ clientX: 200, clientY }],
							})
					touchAt('touchstart', 300)
					touchAt('touchmove', 340)
					touchAt('touchmove', 420)
					touchAt('touchmove', 420)
					cy.get(COMMON_SELECTORS.IMAGE_GALLERY_STAGE).should(
						'have.attr',
						'style',
						'transform: translateY(120px);',
					)
					shot(`photo-states-lightbox-swipe-${width}`, LIGHTBOX_SHOT)
					touchAt('touchend', 420)
					cy.get(COMMON_SELECTORS.IMAGE_GALLERY_STAGE).should(
						($stage) =>
							expect($stage[0].style.transform).to.equal(''),
					)
					cy.get('[role="dialog"]').should('be.visible')
				}

				next(1)
				settleOn(1)
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL)
					.should('have.attr', 'src', portrait.file)
					.and('be.visible')
				shot(`photo-states-lightbox-portrait-${width}`, LIGHTBOX_SHOT)

				// The held photo has no thumbnail, so its place is a skeleton block with the loading status
				next(3)
				settleOn(4)
				cy.contains('[role="dialog"]', 'Loading photo…')
				freezeAnimation()
				shot(`photo-states-lightbox-loading-${width}`, LIGHTBOX_SHOT)

				next(1)
				settleOn(5)
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL)
					.should('have.attr', 'src', panorama.file)
					.and('be.visible')
				shot(`photo-states-lightbox-panorama-${width}`, LIGHTBOX_SHOT)
				// Phones held sideways keep the arrows in the bottom row, lined up with the title and Close
				if (width === 1280) {
					;[
						[667, 375],
						[844, 390],
						[932, 430],
					].forEach(([landscapeWidth, landscapeHeight]) => {
						cy.viewport(landscapeWidth, landscapeHeight)
						settleOn(5)
						shot(
							`photo-states-lightbox-landscape-${landscapeWidth}x${landscapeHeight}`,
							LIGHTBOX_SHOT,
						)
					})
					cy.viewport(width, HEIGHT)
					settleOn(5)
				}

				next(1)
				settleOn(6)
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FALLBACK).should(
					'contain.text',
					'Photo unavailable',
				)
				cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).should(
					'be.disabled',
				)
				shot(
					`photo-states-lightbox-last-failed-${width}`,
					LIGHTBOX_SHOT,
				)

				cy.request({
					method: 'PATCH',
					url: emulatorDatabase(`travellers/${PHOTOS_ID}`),
					body: {
						files: [landscape.file],
						fileThumbnails: [landscape.thumbnails],
					},
				})
				visit(`${PATHS.TRAVELLERS}/${PHOTOS_ID}`)
				assertSettled()
				cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).first().click()
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL).should('be.visible')
				cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
					'not.exist',
				)
				shot(`photo-states-lightbox-one-photo-${width}`, LIGHTBOX_SHOT)
				cy.request({
					method: 'PATCH',
					url: emulatorDatabase(`travellers/${PHOTOS_ID}`),
					body: PHOTO_STATES,
				})
			}

			eachWidth((width) => {
				capture(width)
				cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).first().click()
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL)
					.should('be.visible')
					.and('have.attr', 'src', landscape.file)
					.and(($img) => expect($img[0].naturalWidth).to.equal(1600))
				freezeAnimation()
				shot(`photo-states-dialog-${width}`)
				lightboxStates(width)
			})

			// A 2x screen picks the 640 thumbnails: same layout, so only the sources change
			cy.viewport(390, HEIGHT)
			cdp('Emulation.setDeviceMetricsOverride', {
				width: 0,
				height: 0,
				deviceScaleFactor: 2,
				mobile: false,
			})
			capture('2x')
		})

		capture('travellers-fallback', () => {
			fallbackThenLoading({
				path: PATHS.TRAVELLERS,
				chunk: 'Travellers',
				data: '**/travellers.json*',
				loading: TRAVELLERS_LIST_SELECTORS.SKELETON_LIST,
				name: 'travellers',
			})
		})

		capture('travellers-loading', () => {
			// Held open so the skeleton cards, and the disabled Refresh and Register, stay on screen
			cy.intercept('GET', '**/travellers.json*', (request) => {
				request.on('response', (response) => {
					response.setDelay(60000)
				})
			})
			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.LOADING).should('exist')
				cy.get(TRAVELLERS_LIST_SELECTORS.SKELETON_LIST).should(
					'be.visible',
				)
				cy.get(TRAVELLERS_LIST_SELECTORS.REFRESH_BUTTON).should(
					'be.disabled',
				)
				cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should(
					'have.attr',
					'aria-disabled',
					'true',
				)
				freezeAnimation()
				shot(`travellers-loading-${width}`)
			})
		})

		capture('travellers-paging', () => {
			// Real seeded records cloned to 30, so the cards keep their photos and badges
			cy.request(emulatorDatabase('travellers')).then(({ body }) => {
				const records = Object.values(body)
				const many = Object.fromEntries(
					Array.from({ length: 30 }, (_, index) => [
						`ui-check-paged-${String(index).padStart(2, '0')}`,
						{
							...records[index % records.length],
							firstName: 'Paged',
							lastName: `Traveller ${index + 1}`,
						},
					]),
				)
				cy.intercept('GET', '**/travellers.json*', { body: many })
			})

			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
					'have.length',
					12,
				)
				assertSettled()
				cy.get(TRAVELLERS_LIST_SELECTORS.PAGE_STATUS).should(
					'have.text',
					'Showing 12 of 30 travellers',
				)
				freezeAnimation()
				shot(`paging-first-${width}`)

				cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE).click()
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM)
					.should('have.length', 24)
					.eq(12)
					.should('have.focus')
				// A mouse click does not match :focus-visible, so the ring a keyboard user sees is forced
				const newCard = `${TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM}[tabindex="-1"]`
				forcePseudo(newCard, ['focus', 'focus-visible'])
				// Clear of the sticky header, with room for the 2px-offset outline
				cy.get(newCard)
					.scrollIntoView({ offset: { top: -120, left: 0 } })
					.should('be.visible')
					.screenshot(shotName(`paging-new-card-focus-${width}`), {
						...SCREENSHOT,
						padding: 12,
						scrollBehavior: false,
					})
				forcePseudo(newCard, [])

				cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE)
					.should('have.text', 'Show 6 more')
					.click()
				cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE).should('not.exist')
				cy.get(TRAVELLERS_LIST_SELECTORS.PAGE_STATUS).should(
					'have.text',
					'All 30 travellers shown',
				)
				freezeAnimation()
				shot(`paging-last-${width}`)
			})

			cy.viewport(1280, HEIGHT)
			visit(PATHS.TRAVELLERS)
			assertSettled()
			forcePseudo(TRAVELLERS_LIST_SELECTORS.SHOW_MORE, ['hover'])
			shot('hover-show-more')
			forcePseudo(TRAVELLERS_LIST_SELECTORS.SHOW_MORE, [
				'focus',
				'focus-visible',
			])
			shot('focus-show-more')
			forcePseudo(TRAVELLERS_LIST_SELECTORS.SHOW_MORE, [])
		})

		capture('travellers-load-error', () => {
			eachWidth((width) => {
				// The page the session left open loads the list too, after cy.visit resolves, so it must finish before the failure is stubbed
				assertSettled()
				// Every load fails, not just the first: a second load after sign-in settles would replace the error with the list
				cy.intercept('GET', '**/travellers.json*', {
					statusCode: 500,
					body: {},
				})
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`travellers-load-error-${width}`)
			})
		})

		capture('travellers-refresh-error', () => {
			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
				assertSettled()
				interceptOnce('GET', '**/travellers.json*', {
					statusCode: 500,
					body: {},
				}).as('failedRefresh')
				cy.get(TRAVELLERS_LIST_SELECTORS.REFRESH_BUTTON).click()
				cy.wait('@failedRefresh')
				cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR).should(
					'be.visible',
				)
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
				freezeAnimation()
				shot(`travellers-refresh-error-${width}`)
			})
		})

		capture('hover-focus', () => {
			cy.viewport(1280, HEIGHT)
			visit(PATHS.TRAVELLERS)
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
			assertSettled()
			;[
				['details', TRAVELLER_ITEM_SELECTORS.VIEW_TRIP, true],
				['refresh', TRAVELLERS_LIST_SELECTORS.REFRESH_BUTTON],
				['register', TRAVELLERS_LIST_SELECTORS.REGISTER_LINK],
				['filter-show-all', TRAVELLER_FILTER_SELECTORS.SHOW_ALL],
				// Hover lands on the chip, keyboard focus on its hidden checkbox
				['filter-chip', TRAVELLER_FILTER_SELECTORS.OPTION],
				[
					'filter-chip-checkbox',
					TRAVELLER_FILTER_SELECTORS.CHECKBOX,
					false,
					{ scroll: false },
				],
				['image-button', COMMON_SELECTORS.BASE_IMAGE_BUTTON, true],
			].forEach(([name, selector, inCard, pseudoOptions]) => {
				// A full-page capture repeats the sticky header over the first card, so card controls are also captured alone
				const capture = (state) => {
					shot(`${state}-${name}`)
					if (inCard) {
						cy.get(selector)
							.first()
							.closest(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM)
							.should('be.visible')
							.screenshot(
								shotName(`${state}-${name}-card`),
								SCREENSHOT,
							)
					}
				}
				// main has no Show all cities, so a control missing from the page is skipped rather than failing the run
				cy.get('body').then(($body) => {
					if (!$body.find(selector).length) return
					forcePseudo(selector, ['hover'], pseudoOptions)
					capture('hover')
					forcePseudo(
						selector,
						['focus', 'focus-visible'],
						pseudoOptions,
					)
					capture('focus')
					forcePseudo(selector, [], pseudoOptions)
				})
			})
		})

		capture('register-errors', () => {
			eachWidth((width) => {
				visit(PATHS.REGISTER)
				cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should(
					'be.visible',
				)
				cy.get(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
				).click()
				cy.get(ERROR_SUMMARY_SELECTORS.ROOT)
					.should('be.visible')
					.and('have.focus')
				cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).should(
					'have.attr',
					'aria-invalid',
					'true',
				)
				freezeAnimation()
				shot(`register-errors-${width}`)

				// Each summary link focuses its own field, the error now sitting between its label and the field
				const { FIRST_NAME_INPUT, TRIP_START_INPUT } =
					TRAVELLER_REGISTRATION_FORM_SELECTORS
				cy.get(ERROR_SUMMARY_SELECTORS.LINK).should('have.length', 7)
				cy.get(ERROR_SUMMARY_SELECTORS.LINK).eq(3).click()
				cy.get(TRIP_START_INPUT).should('have.focus')
				cy.get(ERROR_SUMMARY_SELECTORS.LINK).eq(6).click()
				cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).should(
					'have.focus',
				)
				cy.get(ERROR_SUMMARY_SELECTORS.LINK).first().click()
				cy.get(FIRST_NAME_INPUT).should('have.focus')
				cy.get(ERROR_SUMMARY_SELECTORS.LINK).eq(5).click()
				cy.get(COMBOBOX_SELECTORS.INPUT).should('have.focus')
				shot(`register-errors-cities-link-${width}`)

				cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
					[
						'cypress/fixtures/test-image.png',
						{
							contents: Cypress.Buffer.from('x'.repeat(2048)),
							fileName: `${'a-very-long-photo-name-'.repeat(3)}.png`,
							mimeType: 'image/png',
						},
					],
					{ force: true },
				)
				cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_ALT_INPUT)
					.first()
					.type('Charles Bridge at sunrise')
				cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should(
					'have.length',
					2,
				)
				shot(`register-photo-rows-${width}`)
			})
		})

		capture('register-files', () => {
			eachWidth((width) => {
				visit(PATHS.REGISTER)
				cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
					[
						'cypress/fixtures/test-image.png',
						{
							contents: Cypress.Buffer.from('x'),
							fileName: 'notes.pdf',
							mimeType: 'application/pdf',
						},
					],
					{ force: true },
				)
				cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should(
					'be.visible',
				)
				cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_ERRORS).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`register-files-rejected-${width}`)
			})
		})

		capture('register-dates', () => {
			const { TRIP_START_INPUT, TRIP_END_INPUT, TRIP_LENGTH } =
				TRAVELLER_REGISTRATION_FORM_SELECTORS
			eachWidth((width) => {
				visit(PATHS.REGISTER)
				cy.get(TRIP_START_INPUT).type('2025-03-12')
				cy.get(TRIP_END_INPUT).type('2025-03-19')
				cy.get(TRIP_LENGTH).should('have.text', '8 days')
				freezeAnimation()
				shot(`register-trip-filled-${width}`)

				cy.get(TRIP_END_INPUT).clear().type('2025-03-10').blur()
				cy.get(TRIP_END_INPUT).should(
					'have.attr',
					'aria-invalid',
					'true',
				)
				shot(`register-trip-end-before-start-${width}`)

				cy.get(TRIP_START_INPUT).clear().type('2999-01-01').blur()
				cy.get(TRIP_START_INPUT).should(
					'have.attr',
					'aria-invalid',
					'true',
				)
				shot(`register-trip-future-${width}`)

				forcePseudo(TRIP_START_INPUT, ['focus', 'focus-visible'])
				shot(`focus-trip-start-${width}`)
				forcePseudo(TRIP_START_INPUT, [])
			})
		})

		capture('register-upload', () => {
			eachWidth((width) => {
				visit(PATHS.REGISTER)
				cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`register-${width}`)

				cy.get(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
				).click()
				shot(`register-validation-${width}`)
			})

			cy.viewport(1280, HEIGHT)
			visit(PATHS.REGISTER)
			cy.selectCity()
			cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
				'cypress/fixtures/test-image.png',
				{ force: true },
			)
			cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('be.visible')
			freezeAnimation()
			;[
				['file-remove', FILE_UPLOADER_SELECTORS.FILE_PREVIEW_REMOVE],
				[
					'city-remove',
					TRAVELLER_REGISTRATION_FORM_SELECTORS.SELECTED_CITY_REMOVE,
				],
			].forEach(([name, selector]) => {
				forcePseudo(selector, ['hover'])
				shot(`hover-${name}`)
				forcePseudo(selector, ['focus', 'focus-visible'])
				shot(`focus-${name}`)
				forcePseudo(selector, [])
			})

			// A real Storage emulator upload, slowed so the progress bar stays on screen
			cdp('Network.enable').then(() =>
				cdp('Network.emulateNetworkConditions', {
					offline: false,
					latency: 500,
					downloadThroughput: 2000,
					uploadThroughput: 2000,
				}),
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
				'Ui',
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
				'Check',
			)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
			).type('A trip registered by the capture script.')
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
				'2025-03-12',
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).type(
				'2025-03-15',
			)
			// Frozen before the upload starts, so the bar shows its real width rather than a frame of its width transition
			freezeAnimation()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()
			cy.get(COMMON_SELECTORS.BASE_PROGRESS, {
				timeout: TIMEOUT,
			}).should('be.visible')
			// The bytes sent first and the reply waits on the throttled network, so 99% is the one stable frame
			cy.contains('(99%)', { timeout: 30000 }).should('be.visible')
			freezeAnimation()
			shot('register-upload-progress')
			cdp('Network.emulateNetworkConditions', {
				offline: false,
				latency: 0,
				downloadThroughput: -1,
				uploadThroughput: -1,
			})
			cy.waitForSuccess(
				(win) => win.location.pathname !== PATHS.REGISTER,
				{ timeout: 30000 },
			)
			// The URL changes before the page renders, so wait for the content or the frame is mid-navigation
			cy.contains(TRAVELLER_REGISTRATION_SUCCESS_MESSAGE).should(
				'be.visible',
			)
			assertSettled()
			shot('register-success')
		})
	})

	context('signed in as a registered traveller', () => {
		beforeEach(() => {
			performLogin(
				TEST_USERS.TRAVELLER.EMAIL,
				TEST_USERS.TRAVELLER.PASSWORD,
			)
		})

		capture('message-button', () => {
			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLER_ITEM_SELECTORS.MESSAGE).should('exist')
				assertSettled()
				freezeAnimation()
				shot(`travellers-message-${width}`)
				recordPhotoRows(`travellers-message-${width}`)

				visit(`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.MESSAGE).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`traveller-detail-message-${width}`)
			})
		})

		capture('messages-fallback', () => {
			fallbackThenLoading({
				path: PATHS.MESSAGES,
				chunk: 'Messages',
				data: '**/userConversations/*.json*',
				loading: MESSAGES_PAGE_SELECTORS.LOADING,
				name: 'messages',
			})
		})

		capture('messages-states', () => {
			// Only Date, so the app's timers still run; message times then read the same in every run
			cy.clock(NOW, ['Date'])
			// A long first message, so the thread scrolls, and a conversation whose traveller cannot be looked up; written past the rules as the emulator owner
			cy.request({
				method: 'PATCH',
				url: emulatorDatabase(''),
				headers: OWNER,
				body: {
					[`conversations/${OTHER_CID}/messages/-OCapture0000000001`]:
						{
							senderId: OTHER,
							message: LONG_MESSAGE,
							createdAt: NOW - 3 * 24 * 60 * 60 * 1000,
						},
					[`conversations/${UNKNOWN_CID}/messages/-OCapture0000000002`]:
						{
							senderId: UNKNOWN_ID,
							message: 'Is the Porto walk free?',
							createdAt: NOW - 20 * 60 * 60 * 1000,
						},
					[`userConversations/${ME}/${UNKNOWN_CID}`]: {
						otherId: UNKNOWN_ID,
						lastId: '-OCapture0000000002',
						lastMessage: 'Is the Porto walk free?',
						lastSenderId: UNKNOWN_ID,
						lastAt: NOW - 20 * 60 * 60 * 1000,
						readAt: NOW - 20 * 60 * 60 * 1000,
					},
				},
			})
			cy.intercept(
				API_DATABASE.GET,
				`**/travellers/${UNKNOWN_ID}.json*`,
				{ statusCode: 500, body: {} },
			)

			eachWidth((width) => {
				markUnread()
				visit(PATHS.TRAVELLERS)
				cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES, {
					timeout: TIMEOUT,
				}).should('exist')
				assertSettled()
				freezeAnimation()
				shot(`nav-unread-count-${width}`)
				// Below the desktop nav the count sits on the tab bar's Messages
				cy.get(
					width <= 768
						? TAB_BAR_SELECTORS.UNREAD
						: TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES,
				).should('be.visible')

				// The list alone below 1024px; from 1024px the unread thread opens beside it
				visit(PATHS.MESSAGES)
				cy.get(CONVERSATION_ROW_SELECTORS.ROOT).should('have.length', 4)
				if (isSplit(width)) {
					cy.get(MESSAGE_THREAD_SELECTORS.NEW_DIVIDER).should(
						'be.visible',
					)
				} else {
					cy.get(CONVERSATION_ROW_SELECTORS.DOT).should(
						'have.length',
						1,
					)
				}
				assertSettled()
				freezeAnimation()
				shot(`messages-${width}`)
				const SECOND_ROW = `${CONVERSATION_ROW_SELECTORS.ROOT}:nth-child(2) ${CONVERSATION_ROW_SELECTORS.LINK}`
				forcePseudo(SECOND_ROW, ['focus', 'focus-visible'])
				shot(`messages-row-focus-${width}`)
				forcePseudo(SECOND_ROW, ['hover'])
				shot(`messages-row-hover-${width}`)
				forcePseudo(SECOND_ROW, [])

				// The unread thread on its own screen, with "New"
				markUnread()
				openThread(OTHER_CID)
				cy.get(MESSAGE_THREAD_SELECTORS.NEW_DIVIDER).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`thread-new-${width}`)

				// Keyboard in the thread: a draft in the reply box, its focus ring drawn
				cy.get(REPLY_BOX_SELECTORS.INPUT).type('Yes! 7 it is.')
				forcePseudo(REPLY_BOX_SELECTORS.INPUT, [
					'focus',
					'focus-visible',
				])
				shot(`thread-draft-${width}`)
				forcePseudo(REPLY_BOX_SELECTORS.INPUT, [])

				// The menu
				cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()
				cy.get(THREAD_HEADER_SELECTORS.MENU).should('be.visible')
				shot(`thread-menu-${width}`)
				cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()

				// Sending, held until the shot; then failed
				interceptOnce(API_DATABASE.PATCH, '**/.json*', {
					statusCode: 500,
					body: {},
					delay: 60000,
				})
				cy.get(REPLY_BOX_SELECTORS.SEND).click()
				cy.get(MESSAGE_BUBBLE_SELECTORS.SENDING).should('be.visible')
				freezeAnimation()
				shot(`thread-sending-${width}`)
				openThread(OTHER_CID)
				interceptOnce(API_DATABASE.PATCH, '**/.json*', {
					statusCode: 500,
					body: {},
				})
				cy.get(REPLY_BOX_SELECTORS.INPUT).type('Yes! 7 it is.')
				cy.get(REPLY_BOX_SELECTORS.SEND).click()
				cy.get(MESSAGE_BUBBLE_SELECTORS.FAILED).should('be.visible')
				freezeAnimation()
				shot(`thread-send-failed-${width}`)

				// A former traveller, an unknown sender and an email-only message
				visit(PATHS.MESSAGES)
				cy.contains(
					CONVERSATION_ROW_SELECTORS.LINK,
					'A former traveller',
				).click()
				cy.get(THREAD_NOTE_SELECTORS.ROOT).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`thread-former-${width}`)
				openThread(UNKNOWN_CID)
				cy.contains(
					MESSAGE_BUBBLE_SELECTORS.ROOT,
					'Is the Porto walk free?',
				)
				assertSettled()
				freezeAnimation()
				shot(`thread-unknown-${width}`)
				visit(PATHS.MESSAGES)
				cy.contains(
					CONVERSATION_ROW_SELECTORS.LINK,
					MOCK_THREADS.LEGACY.userEmail,
				).click()
				cy.get(THREAD_NOTE_SELECTORS.REPLY_BY_EMAIL).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`thread-email-only-${width}`)

				// The thread failing to load, with Try again
				interceptOnce(
					API_DATABASE.GET,
					`**/conversations/${OTHER_CID}/messages.json*`,
					{ statusCode: 500, body: {} },
				)
				openThread(OTHER_CID)
				cy.get(MESSAGES_PAGE_SELECTORS.THREAD_ERROR).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`thread-load-error-${width}`)

				// The thread loading: its header from the list, skeleton bubbles below
				cy.intercept(
					API_DATABASE.GET,
					`**/conversations/${OTHER_CID}/messages.json*`,
					(req) => req.on('response', (res) => res.setDelay(60000)),
				)
				openThread(OTHER_CID)
				cy.get(CONVERSATION_SKELETON_SELECTORS.THREAD).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`thread-loading-${width}`)
				cy.intercept(
					API_DATABASE.GET,
					`**/conversations/${OTHER_CID}/messages.json*`,
					(req) => req.continue(),
				)

				// The list loading, every request held until the shot
				cy.intercept(
					API_DATABASE.GET,
					'**/userConversations/*.json*',
					(req) => req.on('response', (res) => res.setDelay(60000)),
				)
				visit(PATHS.MESSAGES)
				cy.get(MESSAGES_PAGE_SELECTORS.LOADING).should('be.visible')
				assertSignedInName()
				freezeAnimation()
				shot(`messages-loading-${width}`)
				cy.intercept(
					API_DATABASE.GET,
					'**/userConversations/*.json*',
					(req) => req.continue(),
				)

				// Delete: the toast, then Undo
				openThread(OTHER_CID)
				cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('exist')
				cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()
				cy.get(THREAD_HEADER_SELECTORS.DELETE).click()
				cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`messages-undo-toast-${width}`)
				cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
					.find(TOAST_SELECTORS.ACTION)
					.click()
				cy.get(CONVERSATION_ROW_SELECTORS.ROOT).should('have.length', 4)
			})

			// A real send and a real delete
			cy.viewport(1280, HEIGHT)
			openThread(OTHER_CID)
			cy.get(REPLY_BOX_SELECTORS.INPUT).type(
				'Sent by the capture script.',
			)
			cy.get(REPLY_BOX_SELECTORS.SEND).click()
			cy.contains(
				MESSAGE_BUBBLE_SELECTORS.ROOT,
				'Sent by the capture script.',
			).should('have.attr', 'data-status', 'sent')
			cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()
			cy.get(THREAD_HEADER_SELECTORS.DELETE).click()
			cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
				.find(TOAST_SELECTORS.DISMISS)
				.click()
			cy.reload()
			cy.get(CONVERSATION_ROW_SELECTORS.ROOT).should('have.length', 3)
			assertSettled()
			freezeAnimation()
			shot('messages-after-delete')
		})

		capture('messages-empty', () => {
			cy.intercept(
				API_DATABASE.GET,
				'**/userConversations/*.json*',
				'null',
			)
			cy.intercept(API_DATABASE.GET, '**/legacyMessages/*.json*', 'null')
			cy.intercept(
				API_DATABASE.GET,
				'**/conversations/*/messages.json*',
				'null',
			)
			eachWidth((width) => {
				visit(PATHS.MESSAGES)
				cy.get(MESSAGES_PAGE_SELECTORS.EMPTY).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`messages-empty-${width}`)

				// A first message to a traveller: the thread says hello
				visit(threadPath(OTHER_CID))
				cy.get(MESSAGE_THREAD_SELECTORS.HELLO, {
					timeout: TIMEOUT,
				}).should('be.visible')
				cy.get(THREAD_HEADER_SELECTORS.NAME).should(
					'contain.text',
					OTHER_NAME,
				)
				assertSettled()
				freezeAnimation()
				shot(`thread-hello-${width}`)
			})
		})

		capture('account-menu', () => {
			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				// Settling before the list mounts finds no photo to wait for
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM, {
					timeout: TIMEOUT,
				}).should('exist')
				assertSettled()
				freezeAnimation()
				// Hover and keyboard focus on the places, inline above 768px and in the tab bar at and below it. Viewport shots are cut at the browser window's 720px, so the viewport matches it
				cy.viewport(width, 720)
				const place =
					width <= 768
						? TAB_BAR_SELECTORS.MY_TRIP
						: TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MY_TRIP
				forcePseudo(place, ['hover'], { scroll: false })
				shot(`nav-hover-${width}`, { capture: 'viewport' })
				// The current place hovered: its bar stays and its label takes on-header-active on the header-active fill
				const current =
					width <= 768
						? TAB_BAR_SELECTORS.TRAVELLERS
						: TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_TRAVELLERS
				forcePseudo(place, [], { scroll: false })
				forcePseudo(current, ['hover'], { scroll: false })
				shot(`nav-hover-current-${width}`, { capture: 'viewport' })
				forcePseudo(current, [], { scroll: false })
				forcePseudo(place, ['focus', 'focus-visible'], {
					scroll: false,
				})
				shot(`nav-focus-${width}`, { capture: 'viewport' })
				forcePseudo(place, [], { scroll: false })
				forcePseudo(
					ACCOUNT_MENU_SELECTORS.BUTTON,
					['focus', 'focus-visible'],
					{
						scroll: false,
					},
				)
				shot(`account-button-focus-${width}`, { capture: 'viewport' })
				forcePseudo(ACCOUNT_MENU_SELECTORS.BUTTON, [], {
					scroll: false,
				})

				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
				cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should('be.visible')
				shot(`account-menu-open-${width}`)
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()

				// The foot of the page on a phone: the footer must clear the docked tab bar
				if (width <= 768) {
					cy.scrollTo('bottom')
					cy.get(FOOTER_SELECTORS.PRIVACY_LINK).then(($privacy) => {
						cy.get(TAB_BAR_SELECTORS.ROOT).then(($bar) => {
							expect(
								$privacy[0].getBoundingClientRect().bottom,
							).to.be.at.most($bar[0].getBoundingClientRect().top)
						})
					})
					shot(`tab-bar-page-foot-${width}`, { capture: 'viewport' })
				}

				// Signed in, the 404 page leads to Travellers
				cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })
				cy.get(PAGE_NOT_FOUND_SELECTORS.ACTION).should(
					'have.text',
					'Go to Travellers',
				)
				// The page renders before the restored session puts the account button in the header
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON, {
					timeout: TIMEOUT,
				}).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`not-found-signed-in-${width}`)
			})
		})

		capture('photo-text-states', () => {
			const travellerPath = `travellers/${TEST_USERS.TRAVELLER.ID}`
			cy.request({
				method: 'PATCH',
				url: emulatorDatabase(travellerPath),
				headers: OWNER,
				body: { fileAlts: { 0: 'Charles Bridge at sunrise' } },
			})

			eachWidth((width) => {
				visit(editTripPath)
				cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
				cy.get(TRIP_PHOTOS_SELECTORS.ALT_INPUT)
					.eq(1)
					.type('Old town square in the snow')
				assertSettled()
				freezeAnimation()
				shot(`edit-trip-alt-text-${width}`)

				visit(ownTripPath)
				assertSettled()
				cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).first().click()
				cy.get(COMMON_SELECTORS.IMAGE_GALLERY_CAPTION).should(
					'have.text',
					'Charles Bridge at sunrise',
				)
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL).should(
					'have.attr',
					'alt',
					'Charles Bridge at sunrise',
				)
				assertImagesLoaded()
				freezeAnimation()
				shot(`photo-dialog-caption-${width}`)
			})

			// A record no user could save now, as travellers registered before photos were required
			cy.request({
				method: 'DELETE',
				url: emulatorDatabase(`${travellerPath}/files`),
				headers: OWNER,
			})
			eachWidth((width) => {
				visit(ownTripPath)
				cy.get(TRAVELLER_DETAIL_SELECTORS.NO_PHOTOS).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`own-trip-no-photos-${width}`)
			})
		})

		capture('own-trip', () => {
			eachWidth((width) => {
				visit(ownTripPath)
				cy.get(TRAVELLER_DETAIL_SELECTORS.EDIT).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`own-trip-${width}`)

				visit(editTripPath)
				cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
				assertSettled()
				freezeAnimation()
				shot(`edit-trip-${width}`)
			})
		})

		// Phones held sideways: the header gutter, the title gap and the Account forms, which must not raise the keyboard
		capture('landscape-phones', () => {
			cy.viewport(390, 844)
			visit(`${ownTripPath}#photos`)
			cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST).should('be.visible')
			assertSettled()
			freezeAnimation()
			shot('photos-anchor-390', { capture: 'viewport' })

			// One column scrolls to the photos; from 1024px they sit at the top beside the profile, so the page stays put with the back link in view
			;[
				[768, 1024],
				[1024, 768],
				[1280, 800],
			].forEach(([width, height]) => {
				cy.viewport(width, height)
				visit(`${ownTripPath}#photos`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`photos-anchor-${width}x${height}`, {
					capture: 'viewport',
				})

				visit(`${editTripPath}#photos`)
				cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
				assertSettled()
				freezeAnimation()
				shot(`edit-photos-anchor-${width}x${height}`, {
					capture: 'viewport',
				})
			})
			;[
				[667, 375],
				[844, 390],
				[932, 430],
			].forEach(([width, height]) => {
				const size = `${width}x${height}`
				const settledShot = (name) => {
					assertSettled()
					freezeAnimation()
					shot(`${name}-${size}`)
				}
				cy.viewport(width, height)

				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM, {
					timeout: TIMEOUT,
				}).should('exist')
				settledShot('travellers')

				visit(PATHS.MESSAGES)
				cy.get(
					`${MESSAGES_PAGE_SELECTORS.LIST_CARD}, ${MESSAGES_PAGE_SELECTORS.EMPTY}`,
					{ timeout: TIMEOUT },
				).should('exist')
				settledShot('messages')

				visit(ownTripPath)
				cy.get(TRAVELLER_DETAIL_SELECTORS.EDIT).should('be.visible')
				settledShot('own-trip')

				// See all photos lands the Photos card a title gap under the header, its top edge in view
				visit(`${ownTripPath}#photos`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`photos-anchor-${size}`, { capture: 'viewport' })

				visit(editTripPath)
				cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
				settledShot('edit-trip')

				visit(PATHS.ACCOUNT)
				cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_EMAIL, {
					timeout: TIMEOUT,
				}).click()
				cy.get(CHANGE_EMAIL_FORM_SELECTORS.ROOT).should('be.visible')
				settledShot('change-email')

				visit(PATHS.ACCOUNT)
				cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_PASSWORD, {
					timeout: TIMEOUT,
				}).click()
				cy.get(CHANGE_PASSWORD_FORM_SELECTORS.ROOT).should('be.visible')
				settledShot('change-password')
			})
		})

		capture('edit-states', () => {
			eachWidth((width) => {
				// Through the link, as a traveller gets there; a visit that only changes the hash would not reload the page
				visit(ownTripPath)
				cy.get(TRAVELLER_DETAIL_SELECTORS.ADD_PHOTOS).click()
				cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).should(
					'have.focus',
				)
				freezeAnimation()
				shot(`edit-trip-add-photos-${width}`)

				cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).eq(3).click()
				cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).eq(1).click()
				cy.get(TRIP_PHOTOS_SELECTORS.UNDO)
					.should('have.length', 2)
					.first()
					.should('have.focus')
				cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
					'cypress/fixtures/test-image.png',
					{ force: true },
				)
				cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should(
					'be.visible',
				)
				forcePseudo(TRIP_PHOTOS_SELECTORS.UNDO, [
					'focus',
					'focus-visible',
				])
				shot(`edit-trip-removed-and-new-${width}`)
				forcePseudo(TRIP_PHOTOS_SELECTORS.UNDO, [])

				forcePseudo(TRIP_PHOTOS_SELECTORS.REMOVE, [
					'focus',
					'focus-visible',
				])
				shot(`edit-trip-focus-remove-${width}`)
				forcePseudo(TRIP_PHOTOS_SELECTORS.REMOVE, [])

				cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT)
					.clear()
					.type('2020-01-01')
					.blur()
				shot(`edit-trip-invalid-${width}`)

				cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT)
					.clear()
					.blur()
				cy.get(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
				).clear()
				cy.get(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
				).click()
				cy.get(ERROR_SUMMARY_SELECTORS.ROOT)
					.should('be.visible')
					.and('have.focus')
				cy.get(ERROR_SUMMARY_SELECTORS.LINK).first().click()
				cy.get(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT,
				).should('have.focus')
				shot(`edit-trip-errors-${width}`)
			})
		})

		capture('edit-photo-count', () => {
			cy.request({
				url: emulatorDatabase(`travellers/${TEST_USERS.TRAVELLER.ID}`),
				headers: OWNER,
			}).then(({ body: seeded }) => {
				const setPhotos = (files) =>
					cy.request({
						method: 'PATCH',
						url: emulatorDatabase(
							`travellers/${TEST_USERS.TRAVELLER.ID}`,
						),
						headers: OWNER,
						body: {
							files,
							fileDimensions: files && seeded.fileDimensions,
							fileThumbnails: files && seeded.fileThumbnails,
						},
					})

				setPhotos(seeded.files.slice(0, 1))
				eachWidth((width) => {
					visit(editTripPath)
					cy.get(TRIP_PHOTOS_SELECTORS.LAST_PHOTO_HINT).should(
						'be.visible',
					)
					freezeAnimation()
					shot(`edit-trip-last-photo-${width}`)
				})

				setPhotos(null)
				eachWidth((width) => {
					visit(ownTripPath)
					cy.get(TRAVELLER_DETAIL_SELECTORS.NO_PHOTOS).should(
						'be.visible',
					)
					assertSettled()
					freezeAnimation()
					shot(`own-trip-no-photos-${width}`)

					visit(editTripPath)
					cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should(
						'be.visible',
					)
					cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('not.exist')
					freezeAnimation()
					shot(`edit-trip-no-photos-${width}`)
				})

				cy.request({
					method: 'PUT',
					url: emulatorDatabase(
						`travellers/${TEST_USERS.TRAVELLER.ID}`,
					),
					headers: OWNER,
					body: seeded,
				})
			})
		})

		capture('detail-states', () => {
			// Every read of the record is held, not just the first: the nav's conversation list reads the same record to name its sender, and can get there before the page
			let isHolding = false
			cy.intercept(
				'GET',
				`**/travellers/${TEST_USERS.OTHER_TRAVELLER.ID}.json*`,
				(req) => {
					if (isHolding) {
						req.on('response', (res) => res.setDelay(4000))
					}
				},
			)
			eachWidth((width) => {
				// The page the session left open must finish its own requests first; then the record is held back, so the loading frame stays on screen
				assertSettled()
				cy.then(() => {
					isHolding = true
				})
				visit(`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.SPINNER).should('be.visible')
				// A delay that missed would otherwise shoot the loaded page
				cy.get(TRAVELLER_DETAIL_SELECTORS.PROFILE).should('not.exist')
				freezeAnimation()
				shot(`traveller-detail-loading-${width}`)
				cy.then(() => {
					isHolding = false
				})

				visit(`${PATHS.TRAVELLERS}/no-such-traveller`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.NOT_FOUND).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`traveller-detail-not-found-${width}`)

				visit(editTripPath)
				cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
				cy.get(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
				).click()
				cy.waitForSuccess(shows(TRAVELLER_DETAIL_SELECTORS.SAVED_ALERT))
				assertSettled()
				freezeAnimation()
				shot(`own-trip-saved-${width}`)
			})

			cy.request({
				method: 'PATCH',
				url: emulatorDatabase(`travellers/${TEST_USERS.TRAVELLER.ID}`),
				headers: OWNER,
				body: {
					firstName: 'María Fernanda',
					lastName: 'Castellanos-Whitfield de la Torre',
				},
			})
			eachWidth((width) => {
				visit(ownTripPath)
				cy.get(TRAVELLER_DETAIL_SELECTORS.NAME).should(
					'contain.text',
					'Castellanos-Whitfield',
				)
				assertSettled()
				freezeAnimation()
				shot(`own-trip-long-name-${width}`)
			})
		})

		capture('edit-save', () => {
			cy.viewport(390, HEIGHT)
			interceptOnce('PATCH', '**/.json*', {
				statusCode: 500,
				body: {},
			}).as('failedSave')
			visit(editTripPath)
			cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()
			cy.wait('@failedSave')
			cy.get(EDIT_TRIP_SELECTORS.ERROR_DIALOG).should('be.visible')
			freezeAnimation()
			shot('edit-trip-save-failed')

			interceptOnce('PATCH', '**/.json*', (req) =>
				req.on('response', (res) => res.setDelay(4000)),
			)
			visit(editTripPath)
			cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()
			cy.get(EDIT_TRIP_SELECTORS.SAVING_DIALOG).should('be.visible')
			freezeAnimation()
			shot('edit-trip-saving')
			cy.waitForSuccess(shows(TRAVELLER_DETAIL_SELECTORS.SAVED_ALERT))

			// A real Storage emulator upload, slowed so the progress bar stays on screen
			cy.viewport(1280, HEIGHT)
			visit(editTripPath)
			cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 4)
			cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
				'cypress/fixtures/test-image.png',
				{ force: true },
			)
			cdp('Network.enable').then(() =>
				cdp('Network.emulateNetworkConditions', {
					offline: false,
					latency: 500,
					downloadThroughput: 2000,
					uploadThroughput: 2000,
				}),
			)
			// Frozen before the upload starts, so the bar shows its real width rather than a frame of its width transition
			freezeAnimation()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()
			cy.get(COMMON_SELECTORS.BASE_PROGRESS, { timeout: TIMEOUT }).should(
				'be.visible',
			)
			// The bytes sent first and the reply waits on the throttled network, so 99% is the one stable frame
			cy.contains('(99%)', { timeout: 30000 }).should('be.visible')
			freezeAnimation()
			shot('edit-trip-upload-progress')
			cdp('Network.emulateNetworkConditions', {
				offline: false,
				latency: 0,
				downloadThroughput: -1,
				uploadThroughput: -1,
			})
			cy.waitForSuccess(shows(TRAVELLER_DETAIL_SELECTORS.SAVED_ALERT), {
				timeout: 30000,
			})
			cy.get(TRAVELLER_DETAIL_SELECTORS.SAVED_ALERT).should(
				'contain.text',
				EDIT_TRIP_CONFIG.SAVED_MESSAGE,
			)
			cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST)
				.find('li')
				.should('have.length.at.least', 5)
			assertSettled()
			freezeAnimation()
			shot('own-trip-saved')
		})

		// It deletes the seeded traveller's account, so the next capture's reset reseeds the users
		capture('delete-profile', () => {
			eachWidth((width) => {
				visit(editTripPath)
				cy.get(EDIT_TRIP_SELECTORS.DELETE).should('be.visible')
				freezeAnimation()
				forcePseudo(EDIT_TRIP_SELECTORS.DELETE, [
					'focus',
					'focus-visible',
				])
				shot(`edit-trip-delete-section-${width}`)
				forcePseudo(EDIT_TRIP_SELECTORS.DELETE, [])
				cy.get(EDIT_TRIP_SELECTORS.DELETE).click()
				cy.get(EDIT_TRIP_SELECTORS.DELETE_CANCEL).should('have.focus')
				shot(`edit-trip-delete-dialog-${width}`)
				cy.get(EDIT_TRIP_SELECTORS.DELETE_CANCEL).click()
			})

			cy.viewport(390, HEIGHT)
			// The record and its public summary go in one root update
			const recordDelete = '**/.json*'
			interceptOnce('PATCH', recordDelete, {
				statusCode: 500,
				body: {},
			}).as('failedDelete')
			visit(editTripPath)
			cy.get(EDIT_TRIP_SELECTORS.DELETE).click()
			cy.get(EDIT_TRIP_SELECTORS.DELETE_CONFIRM).click()
			cy.wait('@failedDelete')
			cy.get(EDIT_TRIP_SELECTORS.ERROR_DIALOG).should('be.visible')
			freezeAnimation()
			shot('edit-trip-delete-failed')

			interceptOnce('PATCH', recordDelete, (req) =>
				req.on('response', (res) => res.setDelay(4000)),
			)
			visit(editTripPath)
			cy.get(EDIT_TRIP_SELECTORS.DELETE).click()
			cy.get(EDIT_TRIP_SELECTORS.DELETE_CONFIRM).click()
			cy.get(EDIT_TRIP_SELECTORS.DELETING).should('be.visible')
			freezeAnimation()
			shot('edit-trip-deleting')
			cy.waitForSuccess(
				(win) =>
					win.document.body.textContent.includes(
						EDIT_TRIP_CONFIG.DELETED_MESSAGE,
					),
				{ timeout: 30000 },
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('be.visible')
			assertSettled()
			freezeAnimation()
			shot('profile-deleted')
		})
	})

	context('signed in as an admin', () => {
		beforeEach(() => {
			performLogin(TEST_USERS.ADMIN.EMAIL, TEST_USERS.ADMIN.PASSWORD)
		})

		capture('admin-delete', () => {
			cy.viewport(1280, HEIGHT)
			visit(PATHS.TRAVELLERS)
			cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).first().click()
			cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_DIALOG).should('be.visible')
			shot('admin-delete-dialog')
		})
	})
	context('with a short city list', () => {
		capture('city-filter-three', () => {
			cy.request({
				method: 'DELETE',
				url: emulatorDatabase('travellers'),
				headers: { Authorization: 'Bearer owner' },
			})
			;['oslo', 'lima', 'rome'].forEach((city, index) => {
				cy.request({
					method: 'PUT',
					url: emulatorDatabase(`travellers/ui-check-few-${index}`),
					headers: { Authorization: 'Bearer owner' },
					body: {
						firstName: `Few${index}`,
						lastName: 'Cities',
						tripDescription: 'Seeded for the short city filter.',
						daysInCity: 2,
						cities: [city],
						files: [BROKEN_IMAGE_URL],
						fileDimensions: [{ width: 640, height: 480 }],
						registered: NOW,
					},
				})
			})
			performLogin()

			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).should(
					'have.length',
					3,
				)
				assertSettled()
				freezeAnimation()
				shot(`city-filter-few-${width}`)
			})
		})
	})
})

// Referenced so a rename of these selectors fails here rather than silently
void COMBOBOX_SELECTORS
void DIALOG_SELECTORS
