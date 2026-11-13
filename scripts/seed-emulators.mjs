#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import zlib from 'node:zlib'
import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

import { MOCK_TRAVELLERS } from '../src/constants/test/mock-data/mock-travellers.js'
import { MOCK_INBOX } from '../src/constants/test/mock-data/mock-messages.js'
import { toPublicTrips } from '../src/utils/publicTrip/index.js'

const PROJECT_ID = 'demo-trip-fotos'
const DATABASE_URL = `https://${PROJECT_ID}-default-rtdb.firebaseio.com`
const BUCKET = `${PROJECT_ID}.appspot.com`
const STORAGE_ORIGIN = 'http://127.0.0.1:9199'
const REQUIRED_HOSTS = [
	'FIREBASE_AUTH_EMULATOR_HOST',
	'FIREBASE_DATABASE_EMULATOR_HOST',
	'FIREBASE_STORAGE_EMULATOR_HOST',
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
// GLOBAL.IMAGE_THUMBNAIL_WIDTHS; the app never upscales, so a thumbnail wider than the photo keeps its size
const THUMBNAIL_WIDTHS = [320, 640]
const PHOTO_COLOURS = ['3b82f6', '10b981', 'f59e0b', 'ef4444']

// A solid-colour PNG, so the seeded photos are real Storage objects that delete and edit like uploaded ones
export const solidPng = (hex, width, height) => {
	const pixel = Buffer.from(hex, 'hex')
	const line = Buffer.concat([Buffer.alloc(1), Buffer.alloc(width * 3)])
	for (let x = 0; x < width; x++) pixel.copy(line, 1 + x * 3)
	const chunk = (type, body) => {
		const length = Buffer.alloc(4)
		length.writeUInt32BE(body.length)
		const typed = Buffer.concat([Buffer.from(type, 'latin1'), body])
		const crc = Buffer.alloc(4)
		crc.writeUInt32BE(zlib.crc32(typed))
		return Buffer.concat([length, typed, crc])
	}
	const header = Buffer.alloc(13)
	header.writeUInt32BE(width, 0)
	header.writeUInt32BE(height, 4)
	header[8] = 8
	header[9] = 2
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', header),
		chunk(
			'IDAT',
			zlib.deflateSync(Buffer.concat(Array(height).fill(line))),
		),
		chunk('IEND', Buffer.alloc(0)),
	])
}

// Fixed paths and tokens, so the download URLs (and the captures that show them) are the same on every seed
const storageObject = (index, colour, variant, width, height) => {
	const name = `seed-${index}-${variant}${colour}.png`
	const path = `images/${SEED_USERS.TRAVELLER_ONE.uid}/${name}`
	const token = `seed-${index}-${variant.replace(/-$/, '') || 'full'}`
	return {
		path,
		token,
		colour,
		width,
		height,
		url: `${STORAGE_ORIGIN}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
	}
}

export const buildPhotos = () =>
	PHOTO_COLOURS.map((colour, index) => ({
		file: storageObject(index, colour, '', WIDTH, HEIGHT),
		thumbnails: THUMBNAIL_WIDTHS.map((width) => {
			const scale = Math.min(1, width / Math.min(WIDTH, HEIGHT))
			return {
				width,
				...storageObject(
					index,
					colour,
					`${width}w-`,
					Math.round(WIDTH * scale),
					Math.round(HEIGHT * scale),
				),
			}
		}),
	}))

export const storageObjects = () =>
	buildPhotos().flatMap(({ file, thumbnails }) => [file, ...thumbnails])

export const buildTravellers = () => {
	const photos = buildPhotos()
	return {
		[SEED_USERS.TRAVELLER_ONE.uid]: {
			firstName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
			lastName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName,
			tripDescription:
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripDescription,
			tripStart: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripStart,
			tripEnd: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripEnd,
			cities: CITIES_ALL_TONES,
			files: photos.map(({ file }) => file.url),
			fileDimensions: photos.map(() => ({
				width: WIDTH,
				height: HEIGHT,
			})),
			fileThumbnails: photos.map(({ thumbnails }) =>
				thumbnails.map(({ width, url }) => ({ width, url })),
			),
			registered: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.registered,
		},
		[SEED_USERS.TRAVELLER_TWO.uid]: {
			firstName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.firstName,
			lastName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.lastName,
			tripDescription:
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.tripDescription,
			daysInCity: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.daysInCity,
			cities: ['tokyo'],
			registered: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.registered,
		},
	}
}

// `now` lets /ui-check seed against the clock it freezes, so "12 min ago" reads the same in every run
export const buildMessages = (now = Date.now()) => ({
	[SEED_USERS.TRAVELLER_ONE.uid]: {
		// From the other seeded traveller, unread, so the card, Reply and the nav count all render
		[MOCK_INBOX.SAMPLE_MESSAGE_ONE.id]: {
			senderId: SEED_USERS.TRAVELLER_TWO.uid,
			message: MOCK_INBOX.SAMPLE_MESSAGE_ONE.message,
			createdAt: now - 12 * 60 * 1000,
			read: false,
		},
		// An older message with only an email, as stored before messaging was travellers-only
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

// A fresh app each call, deleted after, so the database connection never
// keeps the process alive or leaks between cy.task calls
const withEmulators = async (work) => {
	assertEmulatorsOnly()
	const app = initializeApp(
		{ projectId: PROJECT_ID, databaseURL: DATABASE_URL },
		`seed-${Date.now()}`,
	)
	try {
		return await work(
			getAuth(app),
			getDatabase(app),
			getStorage(app).bucket(BUCKET),
		)
	} finally {
		await deleteApp(app)
	}
}

// Every image goes first, so a photo a capture uploaded or deleted is back to the seed too
const writePhotos = async (bucket) => {
	await bucket.deleteFiles({ prefix: 'images/' })
	await Promise.all(
		storageObjects().map(({ path, token, colour, width, height }) =>
			bucket.file(path).save(solidPng(colour, width, height), {
				contentType: 'image/png',
				metadata: {
					metadata: {
						firebaseStorageDownloadTokens: token,
						userId: SEED_USERS.TRAVELLER_ONE.uid,
					},
				},
			}),
		),
	)
}

const writeData = async (db, bucket, now) => {
	await writePhotos(bucket)
	const travellers = buildTravellers()
	await db.ref().set({
		travellers,
		publicTrips: toPublicTrips(travellers),
		messages: buildMessages(now),
	})
}

const seed = async (auth, db, bucket, now) => {
	// Clear first so a re-run always starts from the same state
	const { users } = await auth.listUsers(1000)
	if (users.length > 0) {
		await auth.deleteUsers(users.map(({ uid }) => uid))
	}

	for (const { uid, email, admin } of Object.values(SEED_USERS)) {
		await auth.createUser({
			uid,
			email,
			password: PASSWORD,
			emailVerified: true,
		})
		if (admin) await auth.setCustomUserClaims(uid, { admin: true })
	}

	await writeData(db, bucket, now)
}

export const seedEmulators = ({ now } = {}) =>
	withEmulators(async (auth, db, bucket) => {
		await seed(auth, db, bucket, now)
		return null
	})

// A capture that deletes its own account leaves the seeded users incomplete
export const needsFullSeed = (users) => {
	const uids = new Set(users.map(({ uid }) => uid))
	return Object.values(SEED_USERS).some(({ uid }) => !uids.has(uid))
}

// The database and photos only, so cy.session stays valid; a full seed when a seeded account is gone, which the caller must follow by clearing the saved sessions
export const resetEmulatorData = ({ now } = {}) =>
	withEmulators(async (auth, db, bucket) => {
		const { users } = await auth.listUsers(1000)
		if (needsFullSeed(users)) {
			await seed(auth, db, bucket, now)
			return { reseeded: true }
		}
		await writeData(db, bucket, now)
		return { reseeded: false }
	})

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		await seedEmulators()
		console.log('Seeded the Firebase emulators.')
	} catch (error) {
		console.error(error.message)
		process.exit(1)
	}
}
