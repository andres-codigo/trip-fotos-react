// Which /ui-check captures and E2E specs a change can affect, read by
// .claude/skills/ui-check/affected.mjs and /verify. A src/ file no area claims
// (shared UI, layout, styles, the store, services, constants) affects them all

const AREAS = {
	authentication: [
		'src/pages/authentication/',
		'src/components/forms/user-authentication/',
		'src/store/slices/authenticationSlice.js',
	],
	privacy: ['src/pages/privacy/'],
	notFound: ['src/pages/page-not-found/'],
	travellers: ['src/pages/travellers/', 'src/components/travellers/'],
	detail: ['src/pages/traveller-detail/'],
	register: [
		'src/pages/register/',
		'src/components/forms/traveller-registration/',
		'src/components/forms/file-uploader/',
	],
	edit: [
		'src/pages/edit-trip/',
		'src/components/forms/trip-photos/',
		// The edit page reuses the registration fields and the uploader
		'src/components/forms/traveller-registration/',
		'src/components/forms/file-uploader/',
	],
	messages: [
		'src/pages/messages/',
		'src/components/messages/',
		'src/store/slices/messagesSlice.js',
	],
	contact: [
		'src/pages/contact-traveller/',
		'src/components/forms/contact-traveller/',
	],
	trips: ['src/store/slices/travellersSlice.js', 'src/utils/tripPhotos/'],
}

// Files that change how every capture is taken
const CAPTURE_TOOLING = [
	'cypress/ui-check/',
	'cypress/support/',
	'cypress.config.js',
	'scripts/seed-emulators.mjs',
]

// Files every E2E spec runs through
const E2E_TOOLING = [
	'cypress/support/',
	'cypress.config.js',
	'scripts/seed-emulators.mjs',
	'.claude/skills/verify/run-e2e.mjs',
]

// Keyed by the id capture.cy.js passes to capture(); the id is what UI_CHECK_ONLY and UI_CHECK_WIDTHS name
export const CAPTURES = {
	'public-pages': {
		title: 'captures the authentication, privacy and 404 pages',
		areas: ['authentication', 'privacy', 'notFound'],
	},
	'auth-form-states': {
		title: 'captures the log in, sign up and password reset forms in their error and sent states',
		areas: ['authentication'],
	},
	'travellers-detail': {
		title: 'captures the travellers list, a failing image and the detail page',
		areas: ['travellers', 'detail', 'trips'],
	},
	'public-travellers': {
		title: 'captures the logged-out Travellers preview: rest, loading, error, empty, broken photo, many trips, filter, focus and Log in from a trip',
		areas: ['travellers', 'authentication', 'trips'],
	},
	'city-filter-many': {
		title: 'captures the city filter with many cities, searched, empty and focused',
		areas: ['travellers'],
	},
	'photo-states': {
		title: 'captures every photo tile state, the source each one loads and the photo dialog',
		areas: ['travellers', 'detail', 'trips'],
	},
	'travellers-loading': {
		title: 'captures the travellers list while it loads',
		areas: ['travellers'],
	},
	'travellers-paging': {
		title: 'captures Travellers paging: first page, the focused new card, the last page',
		areas: ['travellers'],
	},
	'travellers-load-error': {
		title: 'captures the inline load error when the list fails to load',
		areas: ['travellers'],
	},
	'travellers-refresh-error': {
		title: 'captures a failed Refresh, which keeps the cards',
		areas: ['travellers'],
	},
	'hover-focus': {
		title: 'captures real hover and keyboard focus on the interactive controls',
		areas: ['travellers'],
	},
	'register-errors': {
		title: 'captures the register error summary and the photo rows with alt text at each width',
		areas: ['register'],
	},
	'register-files': {
		title: 'captures the register file list with previews and a rejected file at each width',
		areas: ['register'],
	},
	'register-dates': {
		title: 'captures the register trip dates states at each width',
		areas: ['register'],
	},
	'register-upload': {
		title: 'captures the register page, previews, the remove buttons and a real upload',
		areas: ['register', 'trips'],
	},
	'message-button': {
		title: 'captures the travellers list and a profile with the Message button',
		areas: ['travellers', 'detail', 'contact'],
	},
	'messages-states': {
		title: 'captures the messages page in every state and a real delete',
		areas: ['messages'],
	},
	'messages-empty': {
		title: 'captures Messages when empty',
		areas: ['messages'],
	},
	'account-menu': {
		title: 'captures the open account menu, the tab bar, the foot of the page and the signed-in 404',
		areas: ['travellers', 'detail', 'notFound'],
	},
	'contact-send': {
		title: "captures the contact form with the recipient's photos and a real send",
		areas: ['contact', 'detail'],
	},
	'photo-text-states': {
		title: 'captures photo alt text on the edit page and in the dialog, and an own trip with no photos',
		areas: ['detail', 'edit', 'trips'],
	},
	'own-trip': {
		title: 'captures your own trip and the edit page at each width',
		areas: ['detail', 'edit', 'trips'],
	},
	'edit-states': {
		title: 'captures the edit page photo and field states',
		areas: ['edit', 'trips'],
	},
	'edit-photo-count': {
		title: 'captures a trip with one photo and with none',
		areas: ['detail', 'edit', 'trips'],
	},
	'detail-states': {
		title: 'captures the detail page loading, not found, saved and with a long name',
		areas: ['detail', 'edit', 'trips'],
	},
	'edit-save': {
		title: 'captures saving, a failed save and a real save',
		areas: ['detail', 'edit', 'trips'],
	},
	'delete-profile': {
		title: 'captures deleting your own profile, failed and for real',
		areas: ['travellers', 'edit', 'trips'],
	},
	'admin-delete': {
		title: 'captures the admin travellers list and the delete dialog',
		areas: ['travellers', 'trips'],
	},
	'city-filter-three': {
		title: 'captures the city filter with three cities',
		areas: ['travellers'],
	},
}

export const E2E_SPECS = {
	'cypress/e2e/app/AppRoutes.cy.js': ['authentication', 'travellers'],
	'cypress/e2e/app/StalePersistedStore.cy.js': [
		'authentication',
		'travellers',
	],
	'cypress/e2e/components/Navigation.cy.js': [
		'authentication',
		'messages',
		'travellers',
		'detail',
		'privacy',
	],
	'cypress/e2e/pages/Authentication.cy.js': ['authentication'],
	'cypress/e2e/pages/ContactTraveller.cy.js': ['contact', 'detail'],
	'cypress/e2e/pages/EditTrip.cy.js': ['edit', 'detail', 'trips'],
	'cypress/e2e/pages/Messages.cy.js': ['messages', 'contact'],
	'cypress/e2e/pages/PageNotFound.cy.js': ['notFound'],
	'cypress/e2e/pages/Privacy.cy.js': ['privacy'],
	'cypress/e2e/pages/Register.cy.js': ['register', 'trips'],
	'cypress/e2e/pages/TravellerDetail.cy.js': ['detail', 'trips'],
	'cypress/e2e/pages/Travellers.cy.js': ['travellers', 'trips'],
}

const ALL = 'all'

// Tests, stories and test ids change no page
const isAppFile = (file) =>
	file.startsWith('src/') &&
	!/(\/__tests__\/|\.(test|cy)\.jsx?$|^src\/constants\/test\/)/.test(file)

const startsWithAny = (file, prefixes) =>
	prefixes.some((prefix) => file.startsWith(prefix))

// The areas the changed files touch, or 'all' when one could touch every page
export const affectedAreas = (files, tooling = []) => {
	const areas = new Set()
	for (const file of files) {
		if (startsWithAny(file, tooling)) return ALL
		if (!isAppFile(file)) continue
		const matched = Object.entries(AREAS).filter(([, prefixes]) =>
			startsWithAny(file, prefixes),
		)
		if (!matched.length) return ALL
		matched.forEach(([area]) => areas.add(area))
	}
	return areas
}

const touches = (areas, covered) =>
	areas === ALL || covered.some((area) => areas.has(area))

export const affectedCaptures = (files) => {
	const areas = affectedAreas(files, CAPTURE_TOOLING)
	return Object.keys(CAPTURES).filter((id) =>
		touches(areas, CAPTURES[id].areas),
	)
}

// A changed spec runs too, even when no app file changed
export const affectedSpecs = (files) => {
	const areas = affectedAreas(files, E2E_TOOLING)
	return Object.keys(E2E_SPECS).filter(
		(spec) => files.includes(spec) || touches(areas, E2E_SPECS[spec]),
	)
}
