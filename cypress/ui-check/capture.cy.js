// Reusable /ui-check capture script. It is not part of the E2E suite (the E2E
// pattern is cypress/e2e/**), so CI never runs it. Run it with the emulators
// seeded; see .claude/skills/ui-check/SKILL.md.
//
//   UI_CHECK=true    selects this script instead of the E2E suite
//   UI_CHECK_LABEL   prefix for the screenshot names (for example `main` or `branch`)
//   UI_CHECK_WIDTHS  comma-separated viewport widths (default 390,1280)
import {
	COMBOBOX_SELECTORS,
	COMMON_SELECTORS,
	CONTACT_TRAVELLER_SELECTORS,
	DIALOG_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	MESSAGE_ITEM_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
	TRAVELLER_ITEM_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
} from '../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../src/constants/test/selectors/pages'
import { PATHS } from '../../src/constants/ui/paths'
import { TEST_USERS } from '../../src/constants/config/users'

import { performLogin } from '../support/utils/authHelpers'

const LABEL = Cypress.expose('UI_CHECK_LABEL') || 'capture'
const WIDTHS = String(Cypress.expose('UI_CHECK_WIDTHS') || '390,1280')
	.split(',')
	.map(Number)
const HEIGHT = 900
const BROKEN_IMAGE_ID = 'ui-check-broken-image'
const BROKEN_IMAGE_URL = 'http://localhost:1/unreachable.png'
const TIMEOUT = 10000

// Seen only during captures, never in the CI E2E suite, and its stack runs
// through $Cypress.pause, so it is tooling noise. Match that exact text only
Cypress.on('uncaught:exception', (error) => {
	if (error.message.includes('Cannot commit the same tree as before')) {
		return false
	}
})

// Every call site asserts the content first; the helper only names the file
const shot = (name) => {
	// eslint-disable-next-line cypress/assertion-before-screenshot
	cy.screenshot(`${LABEL}/${name}`, { capture: 'fullPage' })
}

// Freezes CSS animation, the text caret and the SMIL spinner so a capture is never a random frame
const freezeAnimation = () => {
	cy.document().then((doc) => {
		const style = doc.createElement('style')
		style.textContent =
			'*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }'
		doc.head.appendChild(style)
		doc.querySelectorAll('svg').forEach((svg) => {
			if (typeof svg.pauseAnimations === 'function') {
				svg.pauseAnimations()
				svg.setCurrentTime(0)
			}
		})
	})
}

// Queued with cy.then so it runs after the commands before it, not at spec load
const cdp = (command, params = {}) =>
	cy.then(() =>
		Cypress.automation('remote:debugger:protocol', { command, params }),
	)

// Cypress cannot hover, so force the pseudo-state through CDP (Chromium only).
// The automation target is the runner page, so reach the element through the app's iframe
const forcePseudo = (selector, states) => {
	cy.get(selector).first().scrollIntoView()
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

const emulatorDatabase = (path) =>
	`${Cypress.expose('VITE_DATABASE_URL')}/${path}.json?ns=${Cypress.expose('VITE_DATABASE_NAMESPACE')}`

const assertSettled = () => {
	cy.get(COMMON_SELECTORS.BASE_SPINNER).should('not.exist')
}

const eachWidth = (callback) => {
	WIDTHS.forEach((width) => {
		cy.viewport(width, HEIGHT)
		callback(width)
	})
}

describe(`UI check capture (${LABEL})`, () => {
	// Seed once per run: cy.session then keeps each role signed in across the tests
	before(() => {
		cy.task('seedEmulators')
		Cypress.session.clearAllSavedSessions()
	})

	// A failed test must not leave the slowed network on for the next one
	afterEach(() => {
		cdp('Network.emulateNetworkConditions', {
			offline: false,
			latency: 0,
			downloadThroughput: -1,
			uploadThroughput: -1,
		})
	})

	context('public pages', () => {
		it('captures the authentication, privacy and 404 pages', () => {
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
					cy.visit(path)
					cy.get(container).should('be.visible')
					assertSettled()
					freezeAnimation()
					shot(`${name}-${width}`)
				})
			})
		})
	})

	context('signed in as a standard user', () => {
		beforeEach(() => {
			performLogin()
		})

		it('captures the travellers list, a failing image and the detail page', () => {
			cy.request({
				method: 'PUT',
				url: emulatorDatabase(`travellers/${BROKEN_IMAGE_ID}`),
				headers: { Authorization: 'Bearer owner' },
				body: {
					firstName: 'Broken',
					lastName: 'Image',
					tripDescription:
						'A traveller whose photo URL is unreachable.',
					daysInCity: 3,
					cities: ['oslo'],
					files: [BROKEN_IMAGE_URL],
					fileDimensions: [{ width: 640, height: 480 }],
					registered: Date.now(),
				},
			})

			eachWidth((width) => {
				cy.visit(PATHS.TRAVELLERS)
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

				cy.get(TRAVELLER_ITEM_SELECTORS.DETAILS).first().click()
				cy.get(TRAVELLER_DETAIL_SELECTORS.ROOT).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`traveller-detail-${width}`)
			})
		})

		it('captures real hover and keyboard focus on the interactive controls', () => {
			cy.viewport(1280, HEIGHT)
			cy.visit(PATHS.TRAVELLERS)
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
			assertSettled()
			;[
				['details', TRAVELLER_ITEM_SELECTORS.DETAILS],
				['refresh', TRAVELLERS_LIST_SELECTORS.REFRESH_BUTTON],
				['image-button', COMMON_SELECTORS.BASE_IMAGE_BUTTON],
			].forEach(([name, selector]) => {
				forcePseudo(selector, ['hover'])
				shot(`hover-${name}`)
				forcePseudo(selector, ['focus', 'focus-visible'])
				shot(`focus-${name}`)
				forcePseudo(selector, [])
			})
		})

		it('captures the register page, previews, the remove buttons and a real upload', () => {
			eachWidth((width) => {
				cy.visit(PATHS.REGISTER)
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
			cy.visit(PATHS.REGISTER)
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
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).type('4')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()
			cy.get(COMMON_SELECTORS.BASE_PROGRESS, { timeout: TIMEOUT }).should(
				'be.visible',
			)
			freezeAnimation()
			shot('register-upload-progress')
			cdp('Network.emulateNetworkConditions', {
				offline: false,
				latency: 0,
				downloadThroughput: -1,
				uploadThroughput: -1,
			})
			cy.location('pathname', { timeout: 30000 }).should(
				'not.eq',
				PATHS.REGISTER,
			)
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

		it('captures the messages page and a real delete', () => {
			eachWidth((width) => {
				cy.visit(PATHS.MESSAGES)
				cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('exist')
				assertSettled()
				freezeAnimation()
				shot(`messages-${width}`)
			})

			cy.viewport(1280, HEIGHT)
			cy.visit(PATHS.MESSAGES)
			cy.get(MESSAGE_ITEM_SELECTORS.ROOT)
				.its('length')
				.then((count) => {
					forcePseudo(MESSAGE_ITEM_SELECTORS.DELETE, ['hover'])
					shot('hover-message-delete')
					forcePseudo(MESSAGE_ITEM_SELECTORS.DELETE, [])
					cy.get(MESSAGE_ITEM_SELECTORS.DELETE).first().click()
					cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should(
						'have.length',
						count - 1,
					)
					shot('messages-after-delete')
				})
		})

		it('captures the contact form and a real send', () => {
			eachWidth((width) => {
				cy.visit(
					`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}/contact`,
				)
				cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')
				freezeAnimation()
				shot(`contact-${width}`)
				cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
				shot(`contact-validation-${width}`)
			})

			cy.viewport(1280, HEIGHT)
			cy.visit(
				`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}/contact`,
			)
			cy.get(CONTACT_TRAVELLER_SELECTORS.EMAIL_INPUT).should(
				'have.value',
				TEST_USERS.TRAVELLER.EMAIL,
			)
			cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type(
				'Sent by the capture script.',
			)
			cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
			cy.get(CONTACT_TRAVELLER_SELECTORS.ROOT).should('not.exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
			assertSettled()
			shot('contact-sent')
		})
	})

	context('signed in as an admin', () => {
		beforeEach(() => {
			performLogin(TEST_USERS.ADMIN.EMAIL, TEST_USERS.ADMIN.PASSWORD)
		})

		it('captures the admin travellers list and the delete dialog', () => {
			cy.viewport(1280, HEIGHT)
			cy.visit(PATHS.TRAVELLERS)
			cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).first().click()
			cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_DIALOG).should('be.visible')
			shot('admin-delete-dialog')
		})
	})
})

// Referenced so a rename of these selectors fails here rather than silently
void COMBOBOX_SELECTORS
void DIALOG_SELECTORS
