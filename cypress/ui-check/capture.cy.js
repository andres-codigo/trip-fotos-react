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
import {
	COMBOBOX_SELECTORS,
	COMMON_SELECTORS,
	CONTACT_TRAVELLER_SELECTORS,
	DIALOG_SELECTORS,
	EDIT_TRIP_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	MESSAGE_ITEM_SELECTORS,
	MESSAGE_SKELETON_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
	TOAST_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
	TRAVELLER_FILTER_SELECTORS,
	TRAVELLER_ITEM_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
	TRIP_PHOTOS_SELECTORS,
} from '../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../src/constants/test/selectors/pages'
import { PATHS } from '../../src/constants/ui/paths'
import { SESSION_STORAGE_KEYS } from '../../src/constants/auth'
import { TEST_USERS } from '../../src/constants/config/users'
import {
	EDIT_TRIP_CONFIG,
	TRAVELLER_REGISTRATION_SUCCESS_MESSAGE,
} from '../../src/constants/travellers'

import { performLogin } from '../support/utils/authHelpers'
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
const shot = (name) => {
	// eslint-disable-next-line cypress/assertion-before-screenshot
	cy.screenshot(shotName(name), { ...SCREENSHOT, capture: 'fullPage' })
}

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

const emulatorDatabase = (path) =>
	`${Cypress.expose('VITE_DATABASE_URL')}/${path}.json?ns=${Cypress.expose('VITE_DATABASE_NAMESPACE')}`

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
// Shown as a date, so a fixed one reads the same on any day
const FORMER_MESSAGE_TIME = new Date(2026, 0, 14, 9, 30).getTime()

const LONG_MESSAGE =
	'Hi! We are heading to Kyoto in late March and your photos of the Philosopher’s Path were the reason we booked. Could you tell us which end you started from, and whether early morning was quiet enough for photos without crowds? Also, was the ryokan near Nanzen-ji worth the price, or would you stay closer to Gion next time? Any tips on the day trip to Nara would be lovely too. Thank you so much for sharing all of this.'

// Opening Messages marks everything read, so each width puts the unread state back first
const markAllUnread = () =>
	cy
		.request({
			url: emulatorDatabase(`messages/${TEST_USERS.TRAVELLER.ID}`),
			headers: OWNER,
		})
		.then(({ body }) => {
			const unread = Object.fromEntries(
				Object.entries(body ?? {})
					.filter(
						([id, message]) =>
							message.senderId && id !== 'capture-former',
					)
					.map(([id]) => [`${id}/read`, false]),
			)
			cy.request({
				method: 'PATCH',
				url: emulatorDatabase(`messages/${TEST_USERS.TRAVELLER.ID}`),
				headers: OWNER,
				body: unread,
			})
		})

// Logout can render before the restored session fills in the name, so a traveller's page is not settled until it shows
const assertSignedInName = () =>
	cy.window({ log: false }).then((win) => {
		const uid = win.localStorage.getItem(SESSION_STORAGE_KEYS.USER_ID)
		if (!uid) return
		cy.request({
			url: emulatorDatabase(`travellers/${uid}`),
			headers: OWNER,
			log: false,
		}).then(({ body }) => {
			if (!body?.firstName) return
			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_LOGOUT, {
				timeout: TIMEOUT,
			}).should('contain.text', body.firstName)
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
	cy.get(MESSAGE_SKELETON_SELECTORS.ROOT, { timeout: TIMEOUT }).should(
		'not.exist',
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

				cy.get(TRAVELLER_ITEM_SELECTORS.DETAILS).first().click()
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
				visit(PATHS.TRAVELLERS)
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

		capture('photo-states', () => {
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
				visit(PATHS.TRAVELLERS)
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
					shotName(`photo-states-list-${suffix}`),
					SCREENSHOT,
				)

				visit(`${PATHS.TRAVELLERS}/${PHOTOS_ID}`)
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

		capture('travellers-loading', () => {
			// Held open so the skeleton cards, and the disabled Refresh and Register, stay on screen
			cy.intercept('GET', '**/travellers.json*', (request) => {
				request.on('response', (response) => {
					response.setDelay(60000)
				})
			})
			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
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
				interceptOnce('GET', '**/travellers.json*', {
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

				cy.get(TRIP_END_INPUT).clear().type('2025-03-10')
				cy.get(TRIP_END_INPUT).should(
					'have.attr',
					'aria-invalid',
					'true',
				)
				shot(`register-trip-end-before-start-${width}`)

				cy.get(TRIP_START_INPUT).clear().type('2999-01-01')
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

		capture('contact-button', () => {
			eachWidth((width) => {
				visit(PATHS.TRAVELLERS)
				cy.get(TRAVELLER_ITEM_SELECTORS.CONTACT).should('exist')
				assertSettled()
				freezeAnimation()
				shot(`travellers-contact-${width}`)

				visit(`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}`)
				cy.get(TRAVELLER_DETAIL_SELECTORS.CONTACT_SECTION).should(
					'be.visible',
				)
				assertSettled()
				freezeAnimation()
				shot(`traveller-detail-contact-${width}`)
			})
		})

		capture('messages-states', () => {
			// Only Date, so the app's timers still run; message times then read the same in every run
			cy.clock(NOW, ['Date'])
			// Extra messages for the long-text and former-traveller states, written past the rules as the emulator owner
			cy.request({
				method: 'PATCH',
				url: emulatorDatabase(`messages/${TEST_USERS.TRAVELLER.ID}`),
				headers: OWNER,
				body: {
					'capture-long': {
						senderId: TEST_USERS.OTHER_TRAVELLER.ID,
						message: LONG_MESSAGE,
						createdAt: NOW - 2 * 60 * 60 * 1000,
						read: false,
					},
					'capture-former': {
						senderId: 'capture-removed-traveller',
						message: 'Thanks for the tips on Kyoto.',
						createdAt: FORMER_MESSAGE_TIME,
						read: true,
					},
				},
			})

			eachWidth((width) => {
				markAllUnread()
				visit(PATHS.TRAVELLERS)
				cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES, {
					timeout: TIMEOUT,
				}).should('exist')
				assertSettled()
				freezeAnimation()
				shot(`nav-unread-count-${width}`)
				// Below the desktop nav the count sits in the hamburger menu
				if (width <= 768) {
					cy.get(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU).click()
					cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should(
						'be.visible',
					)
					shot(`nav-unread-count-menu-${width}`)
				}

				visit(PATHS.MESSAGES)
				cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG).should('exist')
				cy.get(MESSAGE_ITEM_SELECTORS.SHOW_ALL).should('exist')
				assertSettled()
				freezeAnimation()
				shot(`messages-${width}`)
				cy.get(MESSAGE_ITEM_SELECTORS.SHOW_ALL).click()
				shot(`messages-show-all-${width}`)

				// The page and the nav's unread count may each request messages, in either order, so every request is held until the shot
				cy.intercept(API_DATABASE.GET, '**/messages/*.json*', (req) =>
					req.on('response', (res) => res.setDelay(60000)),
				).as('slowMessages')
				visit(PATHS.MESSAGES)
				cy.get(MESSAGE_SKELETON_SELECTORS.ROOT).should('have.length', 3)
				freezeAnimation()
				shot(`messages-loading-${width}`)
				// The newest handler runs first, and continuing ends the chain, so this releases the hold
				cy.intercept(API_DATABASE.GET, '**/messages/*.json*', (req) =>
					req.continue(),
				)

				markAllUnread()
				visit(PATHS.MESSAGES)
				cy.get(MESSAGE_ITEM_SELECTORS.REPLY).first().click()
				cy.get(CONTACT_TRAVELLER_SELECTORS.REPLY_QUOTE).should(
					'be.visible',
				)
				freezeAnimation()
				shot(`contact-reply-${width}`)
			})

			cy.viewport(1280, HEIGHT)
			visit(PATHS.MESSAGES)
			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 4)
			assertSettled()
			forcePseudo(MESSAGE_ITEM_SELECTORS.DELETE, ['hover'])
			shot('hover-message-delete')
			forcePseudo(MESSAGE_ITEM_SELECTORS.DELETE, [
				'focus',
				'focus-visible',
			])
			shot('focus-message-delete')
			forcePseudo(MESSAGE_ITEM_SELECTORS.DELETE, [])

			eachWidth((width) => {
				visit(PATHS.MESSAGES)
				cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 4)
				cy.get(MESSAGE_ITEM_SELECTORS.DELETE).first().click()
				cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST).should('be.visible')
				freezeAnimation()
				shot(`messages-undo-toast-${width}`)
				cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
					.find(TOAST_SELECTORS.ACTION)
					.click()
				cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 4)

				interceptOnce(API_DATABASE.DELETE, '**/messages/*/*.json*', {
					statusCode: 500,
					body: {},
				}).as('failedDelete')
				cy.get(MESSAGE_ITEM_SELECTORS.DELETE).first().click()
				cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
					.find(TOAST_SELECTORS.DISMISS)
					.click()
				cy.wait('@failedDelete')
				cy.get(MESSAGE_ITEM_SELECTORS.DELETE_ERROR).should('be.visible')
				freezeAnimation()
				shot(`messages-delete-failed-${width}`)
			})

			cy.viewport(1280, HEIGHT)
			visit(PATHS.MESSAGES)
			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 4)
			cy.get(MESSAGE_ITEM_SELECTORS.DELETE).first().click()
			cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
				.find(TOAST_SELECTORS.DISMISS)
				.click()
			cy.reload()
			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 3)
			assertSettled()
			shot('messages-after-delete')
		})

		capture('messages-empty', () => {
			cy.intercept(API_DATABASE.GET, '**/messages/*.json*', 'null')
			eachWidth((width) => {
				visit(PATHS.MESSAGES)
				cy.get(MESSAGES_PAGE_SELECTORS.EMPTY).should('be.visible')
				assertSettled()
				freezeAnimation()
				shot(`messages-empty-${width}`)
			})
		})

		capture('mobile-menu', () => {
			;[390, 768].forEach((width) => {
				cy.viewport(width, HEIGHT)
				visit(PATHS.TRAVELLERS)
				assertSettled()
				cy.get(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU).click()
				cy.get(
					TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEMS_CONTAINER,
				).should('be.visible')
				freezeAnimation()
				shot(`mobile-menu-open-${width}`)
			})
		})

		capture('contact-send', () => {
			eachWidth((width) => {
				visit(
					`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}/contact`,
				)
				cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')
				freezeAnimation()
				shot(`contact-${width}`)
				cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
				shot(`contact-validation-${width}`)
			})

			cy.viewport(1280, HEIGHT)
			visit(
				`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}/contact`,
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

		capture('edit-save', () => {
			cy.viewport(390, HEIGHT)
			interceptOnce('PATCH', '**/travellers/*.json*', {
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

			interceptOnce('PATCH', '**/travellers/*.json*', (req) =>
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
			const recordDelete = `**/travellers/${TEST_USERS.TRAVELLER.ID}.json*`
			interceptOnce('DELETE', recordDelete, {
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

			interceptOnce('DELETE', recordDelete, (req) =>
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
