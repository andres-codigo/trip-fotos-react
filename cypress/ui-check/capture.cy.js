// Reusable /ui-check capture script. It is not part of the E2E suite (the E2E
// pattern is cypress/e2e/**), so CI never runs it. Run it with the emulators
// seeded; see .claude/skills/ui-check/SKILL.md.
//
//   UI_CHECK=true    selects this script instead of the E2E suite
//   UI_CHECK_LABEL   prefix for the screenshot names (for example `main` or `branch`)
//   UI_CHECK_WIDTHS  comma-separated viewport widths (default 390,1280)
import { API_DATABASE } from '../../src/constants/api'
import {
	COMBOBOX_SELECTORS,
	COMMON_SELECTORS,
	CONTACT_TRAVELLER_SELECTORS,
	DIALOG_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	MESSAGE_ITEM_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
	TRAVELLER_FILTER_SELECTORS,
	TRAVELLER_ITEM_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
} from '../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../src/constants/test/selectors/pages'
import { PATHS } from '../../src/constants/ui/paths'
import { TEST_USERS } from '../../src/constants/config/users'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '../../src/constants/travellers'

import { performLogin } from '../support/utils/authHelpers'

const LABEL = Cypress.expose('UI_CHECK_LABEL') || 'capture'
const WIDTHS = String(Cypress.expose('UI_CHECK_WIDTHS') || '390,1280')
	.split(',')
	.map(Number)
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

// Every call site asserts the content first; the helper only names the file
const shot = (name) => {
	// eslint-disable-next-line cypress/assertion-before-screenshot
	cy.screenshot(`${LABEL}/${name}`, { capture: 'fullPage' })
}

// Freezes CSS animation (the spinner too) and the text caret so a capture is never a random frame
const freezeAnimation = () => {
	cy.document().then((doc) => {
		const style = doc.createElement('style')
		style.textContent =
			'*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }'
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

const emulatorDatabase = (path) =>
	`${Cypress.expose('VITE_DATABASE_URL')}/${path}.json?ns=${Cypress.expose('VITE_DATABASE_NAMESPACE')}`

const assertSettled = () => {
	cy.get(COMMON_SELECTORS.BASE_SPINNER).should('not.exist')
	cy.get(TRAVELLERS_LIST_SELECTORS.LOADING, { timeout: TIMEOUT }).should(
		'not.exist',
	)
}

// Earlier steps add travellers, so a card the step needs can sit beyond the first page
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
	WIDTHS.forEach((width) => {
		cy.viewport(width, HEIGHT)
		callback(width)
	})
}

describe(`UI check capture (${LABEL})`, () => {
	// Seed once per run: cy.session then keeps each role signed in across the tests
	before(() => {
		cy.task('clearUiCheckScreenshots', LABEL)
		cy.task('seedEmulators')
		Cypress.session.clearAllSavedSessions()
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

		it('captures the city filter with many cities, searched, empty and focused', () => {
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
						registered: Date.now(),
					},
				})
			})

			// Literal selectors keep the script usable on main, which lacks the new ones
			const filter = (name) => `[data-cy="traveller-filter-${name}"]`
			// Case-insensitive: main shows stored ids as they are ("oslo")
			const chip = (name) => [filter('option'), new RegExp(name, 'i')]

			const inlineStates = (width) => {
				cy.get(filter('list')).first().focus()
				shot(`city-filter-list-focus-${width}`)
				cy.get(filter('search')).first().type('o')
				cy.get(filter('checkbox')).should('exist')
				shot(`city-filter-searched-${width}`)
				cy.contains(...chip('Oslo')).click()
				cy.get(filter('status')).should('contain', ' of ')
				shot(`city-filter-ticked-${width}`)
				cy.get(filter('search')).first().clear().type('zzz')
				cy.get(filter('empty')).should('be.visible')
				shot(`city-filter-empty-${width}`)
			}

			const sheetStates = (width) => {
				cy.get(filter('trigger')).click()
				cy.get(filter('sheet')).should('be.visible')
				shot(`city-filter-sheet-${width}`)
				cy.get(filter('sheet'))
					.contains(...chip('Oslo'))
					.click()
				cy.get(filter('sheet'))
					.contains(...chip('Rome'))
					.click()
				cy.get(filter('sheet'))
					.find(`${filter('checkbox')}:checked`)
					.should('have.length', 2)
				shot(`city-filter-sheet-ticked-${width}`)
				cy.get(filter('sheet')).find(filter('search')).type('o')
				shot(`city-filter-sheet-searched-${width}`)
				cy.get(filter('sheet'))
					.find(filter('search'))
					.clear()
					.type('zzz')
				cy.get(filter('sheet'))
					.find(filter('empty'))
					.should('be.visible')
				shot(`city-filter-sheet-empty-${width}`)
				cy.get(filter('sheet')).find(filter('search')).clear()
				forcePseudo(`${filter('sheet')} ${filter('checkbox')}`, [
					'focus',
					'focus-visible',
				])
				shot(`city-filter-sheet-chip-focus-${width}`)
				forcePseudo(`${filter('sheet')} ${filter('checkbox')}`, [])
				cy.get(filter('show-matches')).click()
				cy.get(filter('sheet')).should('not.exist')
				cy.get(filter('trigger')).should('contain', '2 of')
				shot(`city-filter-narrowed-${width}`)
			}

			eachWidth((width) => {
				cy.visit(PATHS.TRAVELLERS)
				cy.get(filter('checkbox')).should('have.length.at.least', 8)
				assertSettled()
				freezeAnimation()
				shot(`city-filter-many-${width}`)

				// The branch swaps the inline filter for a sheet at 768px and below; main and wider screens keep it inline
				cy.get('body').then(($body) => {
					if ($body.find(`${filter('trigger')}:visible`).length) {
						sheetStates(width)
					} else if ($body.find(filter('search')).length) {
						inlineStates(width)
					}
				})
			})
		})

		it('captures every photo tile state, the source each one loads and the photo dialog', () => {
			const isBranch = LABEL !== 'main'
			cy.request({
				method: 'PUT',
				url: emulatorDatabase(`travellers/${PHOTOS_ID}`),
				headers: { Authorization: 'Bearer owner' },
				body: {
					firstName: 'Photo',
					lastName: 'States',
					tripDescription:
						'Thumbnails, a legacy photo, a failing thumbnail and a slow photo.',
					daysInCity: 2,
					cities: ['lisbon'],
					...PHOTO_STATES,
					registered: Date.now(),
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
			const branchList = (thumbnailSize) => {
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
				cy.visit(PATHS.TRAVELLERS)
				assertSettled()
				showAllTravellers()
				cy.get(listItem).should('have.length', 1)
				if (isBranch)
					assertSources(
						listItem,
						branchList(suffix === '2x' ? 640 : 320),
					)
				else tiles(listItem)
				cy.get(
					`${listItem} ${TRAVELLER_ITEM_SELECTORS.SEE_ALL_LINK}`,
				).should('contain.text', 'See all 7 photos')
				freezeAnimation()
				// The seeded list is many screens long, so only this traveller is captured
				cy.get(listItem).screenshot(
					`${LABEL}/photo-states-list-${suffix}`,
				)

				cy.visit(`${PATHS.TRAVELLERS}/${PHOTOS_ID}`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST).should(
					'be.visible',
				)
				assertSettled()
				if (isBranch) {
					const size = suffix === '2x' ? 640 : 320
					assertSources(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST, [
						...branchList(size),
						SLOW_PHOTO_URL,
						panorama.thumbnails.find(({ width }) => width === size)
							.url,
						square.thumbnails.find(({ width }) => width === size)
							.url,
					])
				} else tiles(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST)
				freezeAnimation()
				shot(`photo-states-detail-${suffix}`)
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

		it('captures the travellers list while it loads', () => {
			// Held open so the skeleton cards, and the disabled Refresh and Register, stay on screen
			cy.intercept('GET', '**/travellers.json*', (request) => {
				request.on('response', (response) => {
					response.setDelay(60000)
				})
			})
			eachWidth((width) => {
				cy.visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.LOADING).should('be.visible')
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

		it('captures Travellers paging: first page, the focused new card, the last page', () => {
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
				cy.visit(PATHS.TRAVELLERS)
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
					.screenshot(`${LABEL}/paging-new-card-focus-${width}`, {
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
			cy.visit(PATHS.TRAVELLERS)
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

		it('captures the inline load error when the list fails to load', () => {
			cy.intercept('GET', '**/travellers.json*', {
				statusCode: 500,
				body: {},
			})
			eachWidth((width) => {
				cy.visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`travellers-load-error-${width}`)
			})
		})

		it('captures a failed Refresh, which keeps the cards', () => {
			eachWidth((width) => {
				cy.visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
				assertSettled()
				cy.intercept('GET', '**/travellers.json*', {
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
				// Later visits must load normally again
				cy.intercept('GET', '**/travellers.json*', (request) =>
					request.continue(),
				)
			})
		})

		it('captures real hover and keyboard focus on the interactive controls', () => {
			cy.viewport(1280, HEIGHT)
			cy.visit(PATHS.TRAVELLERS)
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
			assertSettled()
			;[
				['details', TRAVELLER_ITEM_SELECTORS.DETAILS, true],
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
							.screenshot(`${LABEL}/${state}-${name}-card`)
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

		it('captures the register file list with previews and a rejected file at each width', () => {
			eachWidth((width) => {
				cy.visit(PATHS.REGISTER)
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

		it('captures the travellers list and a profile with the Contact button', () => {
			eachWidth((width) => {
				cy.visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLER_ITEM_SELECTORS.CONTACT).should('exist')
				assertSettled()
				freezeAnimation()
				shot(`travellers-contact-${width}`)

				cy.visit(`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.CONTACT_SECTION).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`traveller-detail-contact-${width}`)
			})
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

		it('captures Messages when empty', () => {
			cy.intercept(API_DATABASE.GET, '**/messages/*.json*', 'null')
			eachWidth((width) => {
				cy.visit(PATHS.MESSAGES)
				cy.get(MESSAGES_PAGE_SELECTORS.EMPTY).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`messages-empty-${width}`)
			})
		})

		it('captures the open mobile menu', () => {
			;[390, 768].forEach((width) => {
				cy.viewport(width, HEIGHT)
				cy.visit(PATHS.TRAVELLERS)
				assertSettled()
				cy.get(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU).click()
				cy.get(
					TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEMS_CONTAINER,
				).should('be.visible')
				freezeAnimation()
				shot(`mobile-menu-open-${width}`)
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
	context('with a short city list', () => {
		it('captures the city filter with three cities', () => {
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
						registered: Date.now(),
					},
				})
			})
			performLogin()

			eachWidth((width) => {
				cy.visit(PATHS.TRAVELLERS)
				cy.get('[data-cy="traveller-filter-checkbox"]').should(
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
