#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'

import { MOCK_TRAVELLERS } from '../src/constants/test/mock-data/mock-travellers.js'
import { MOCK_INBOX } from '../src/constants/test/mock-data/mock-messages.js'

const PROJECT_ID = 'demo-trip-fotos'
const DATABASE_URL = `https://${PROJECT_ID}-default-rtdb.firebaseio.com`
const REQUIRED_HOSTS = [
	'FIREBASE_AUTH_EMULATOR_HOST',
	'FIREBASE_DATABASE_EMULATOR_HOST',
]

const PASSWORD = 'seed-password-1'

export const SEED_USERS = Object.freeze({
	STANDARD: { uid: 'seed-standard', email: 'standard@example.com' },
	TRAVELLER_ONE: { uid: 'seed-traveller-one', email: 'one@example.com' },
	TRAVELLER_TWO: { uid: 'seed-traveller-two', email: 'two@example.com' },
	ADMIN: { uid: 'seed-admin', email: 'admin@example.com', admin: true },
})
export const SEED_PASSWORD = PASSWORD

// One city per badge tone (see getToneIndex), so every tone renders
const CITIES_ALL_TONES = [
	'vienna',
	'prague',
	'krakow',
	'paris',
	'lisbon',
	'rome',
	'tokyo',
	'oslo',
]

const WIDTH = 640
const HEIGHT = 480

const placeholderImage = (colour) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"><rect width="100%" height="100%" fill="${colour}"/></svg>`,
	)}`

const PHOTOS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(
	placeholderImage,
)

export const buildTravellers = () => ({
	[SEED_USERS.TRAVELLER_ONE.uid]: {
		firstName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
		lastName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName,
		tripDescription: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripDescription,
		daysInCity: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.daysInCity,
		cities: CITIES_ALL_TONES,
		files: PHOTOS,
		fileDimensions: PHOTOS.map(() => ({ width: WIDTH, height: HEIGHT })),
		registered: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.registered,
	},
	[SEED_USERS.TRAVELLER_TWO.uid]: {
		firstName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.firstName,
		lastName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.lastName,
		tripDescription: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.tripDescription,
		daysInCity: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.daysInCity,
		cities: ['tokyo'],
		registered: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.registered,
	},
})

export const buildMessages = () => ({
	[SEED_USERS.TRAVELLER_ONE.uid]: {
		[MOCK_INBOX.SAMPLE_MESSAGE_ONE.id]: {
			userEmail: MOCK_INBOX.SAMPLE_MESSAGE_ONE.userEmail,
			message: MOCK_INBOX.SAMPLE_MESSAGE_ONE.message,
		},
		[MOCK_INBOX.SAMPLE_MESSAGE_TWO.id]: {
			userEmail: MOCK_INBOX.SAMPLE_MESSAGE_TWO.userEmail,
			message: MOCK_INBOX.SAMPLE_MESSAGE_TWO.message,
		},
	},
})

export const assertEmulatorsOnly = (env = process.env) => {
	const missing = REQUIRED_HOSTS.filter((name) => !env[name])
	if (missing.length > 0) {
		throw new Error(
			`Refusing to seed: ${missing.join(' and ')} must be set, so this can never write to the live project.`,
		)
	}
}

export const seedEmulators = async () => {
	assertEmulatorsOnly()

	// A fresh app each call, deleted after, so the database connection never
	// keeps the process alive or leaks between cy.task calls
	const app = initializeApp(
		{ projectId: PROJECT_ID, databaseURL: DATABASE_URL },
		`seed-${Date.now()}`,
	)
	try {
		await seed(getAuth(app), getDatabase(app))
	} finally {
		await deleteApp(app)
	}

	return null
}

const seed = async (auth, db) => {
	// Clear first so a re-run always starts from the same state
	const { users } = await auth.listUsers(1000)
	if (users.length > 0) {
		await auth.deleteUsers(users.map(({ uid }) => uid))
	}
	await db.ref().remove()

	for (const { uid, email, admin } of Object.values(SEED_USERS)) {
		await auth.createUser({
			uid,
			email,
			password: PASSWORD,
			emailVerified: true,
		})
		if (admin) await auth.setCustomUserClaims(uid, { admin: true })
	}

	await db.ref('travellers').set(buildTravellers())
	await db.ref('messages').set(buildMessages())
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		await seedEmulators()
		console.log('Seeded the Firebase emulators.')
	} catch (error) {
		console.error(error.message)
		process.exit(1)
	}
}
