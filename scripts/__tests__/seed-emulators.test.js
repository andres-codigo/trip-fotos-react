import { describe, expect, it } from 'vitest'

import { MOCK_INBOX } from '@/constants/test/mock-data/mock-messages'
import { TONE_COUNT, getToneIndex } from '@/utils/getToneIndex'

import { decodePng } from '../../.claude/skills/ui-check/compare.mjs'
import {
	SEED_USERS,
	assertEmulatorsOnly,
	buildMessages,
	buildTravellers,
	needsFullSeed,
	solidPng,
	storageObjects,
} from '../seed-emulators.mjs'

describe('seed-emulators', () => {
	describe('assertEmulatorsOnly', () => {
		const hosts = {
			FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
			FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000',
			FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
		}

		it('passes when every emulator host is set', () => {
			expect(() => assertEmulatorsOnly(hosts)).not.toThrow()
		})

		it.each(Object.keys(hosts))('refuses when %s is missing', (name) => {
			const env = { ...hosts, [name]: undefined }

			expect(() => assertEmulatorsOnly(env)).toThrow(
				new RegExp(`${name}.*live project`),
			)
		})

		it('refuses when none is set', () => {
			expect(() => assertEmulatorsOnly({})).toThrow(
				/AUTH.*DATABASE.*STORAGE/,
			)
		})
	})

	describe('seeded data', () => {
		const travellers = buildTravellers()
		const [withPhotos, withoutPhotos] = [
			travellers[SEED_USERS.TRAVELLER_ONE.uid],
			travellers[SEED_USERS.TRAVELLER_TWO.uid],
		]

		it('has one traveller with several photos and one with none', () => {
			expect(withPhotos.files.length).toBeGreaterThan(1)
			expect(withoutPhotos.files ?? []).toHaveLength(0)
		})

		it('gives every photo the width and height the database rules require', () => {
			expect(withPhotos.fileDimensions).toHaveLength(
				withPhotos.files.length,
			)
			withPhotos.fileDimensions.forEach(({ width, height }) => {
				expect(width).toBeGreaterThan(0)
				expect(height).toBeGreaterThan(0)
			})
		})

		it('points every photo and thumbnail at a Storage emulator object, never an inline data: URL', () => {
			const urls = new Set(storageObjects().map(({ url }) => url))
			const thumbnails = withPhotos.fileThumbnails.flatMap((sizes) =>
				sizes.map(({ url }) => url),
			)

			expect(withPhotos.fileThumbnails).toHaveLength(
				withPhotos.files.length,
			)
			;[...withPhotos.files, ...thumbnails].forEach((url) => {
				expect(url).toMatch(
					/^http:\/\/127\.0\.0\.1:9199\/v0\/b\/demo-trip-fotos\.appspot\.com\/o\/images%2Fseed-traveller-one%2F.+\?alt=media&token=/,
				)
				expect(urls.has(url)).toBe(true)
			})
			expect(urls.size).toBe(storageObjects().length)
		})

		it('sizes each thumbnail with its shortest side at its width, never larger than the photo', () => {
			const [file, ...thumbnails] = storageObjects().slice(0, 3)

			expect([file.width, file.height]).toEqual([640, 480])
			expect(
				thumbnails.map(({ width, height }) => [width, height]),
			).toEqual([
				[427, 320],
				[640, 480],
			])
		})

		it('uses tripDescription and covers all eight badge tones', () => {
			expect(withPhotos.tripDescription).toBeTruthy()
			const tones = new Set(withPhotos.cities.map(getToneIndex))

			expect(tones.size).toBe(TONE_COUNT)
		})

		it('only creates travellers for the traveller users', () => {
			expect(Object.keys(travellers).sort()).toEqual(
				[
					SEED_USERS.TRAVELLER_ONE.uid,
					SEED_USERS.TRAVELLER_TWO.uid,
				].sort(),
			)
		})

		it('gives the first traveller a message from the second, with the fields the rules require of a new message', () => {
			const messages = buildMessages()[SEED_USERS.TRAVELLER_ONE.uid]
			const fromTraveller = messages[MOCK_INBOX.SAMPLE_MESSAGE_ONE.id]

			expect(Object.keys(fromTraveller).sort()).toEqual([
				'createdAt',
				'message',
				'read',
				'senderId',
			])
			expect(fromTraveller.senderId).toBe(SEED_USERS.TRAVELLER_TWO.uid)
			expect(fromTraveller.read).toBe(false)
			expect(typeof fromTraveller.createdAt).toBe('number')
		})

		it('keeps one older message with only an email, as stored before messaging was travellers-only', () => {
			const older =
				buildMessages()[SEED_USERS.TRAVELLER_ONE.uid][
					MOCK_INBOX.SAMPLE_MESSAGE_TWO.id
				]

			expect(Object.keys(older).sort()).toEqual(['message', 'userEmail'])
		})
	})

	it('dates the unread message from the clock it is given', () => {
		const now = Date.UTC(2026, 5, 15, 12)
		const message =
			buildMessages(now)[SEED_USERS.TRAVELLER_ONE.uid][
				MOCK_INBOX.SAMPLE_MESSAGE_ONE.id
			]

		expect(message.createdAt).toBe(now - 12 * 60 * 1000)
	})

	it('writes a PNG of the given size and colour', () => {
		const image = decodePng(solidPng('3b82f6', 5, 3))

		expect([image.width, image.height]).toEqual([5, 3])
		expect([...image.data.subarray(0, 4)]).toEqual([0x3b, 0x82, 0xf6, 255])
		expect([...image.data.subarray(-4)]).toEqual([0x3b, 0x82, 0xf6, 255])
	})

	describe('needsFullSeed', () => {
		const seeded = Object.values(SEED_USERS).map(({ uid }) => ({ uid }))

		it('keeps the accounts when every seeded user exists, extra users or not', () => {
			expect(needsFullSeed(seeded)).toBe(false)
			expect(needsFullSeed([...seeded, { uid: 'registered' }])).toBe(
				false,
			)
		})

		it('reseeds when a seeded user has deleted their account', () => {
			const withoutTraveller = seeded.filter(
				({ uid }) => uid !== SEED_USERS.TRAVELLER_ONE.uid,
			)

			expect(needsFullSeed(withoutTraveller)).toBe(true)
			expect(needsFullSeed([])).toBe(true)
		})
	})
})
