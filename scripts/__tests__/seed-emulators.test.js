import { describe, expect, it } from 'vitest'

import { TONE_COUNT, getToneIndex } from '@/utils/getToneIndex'

import {
	SEED_USERS,
	assertEmulatorsOnly,
	buildMessages,
	buildTravellers,
} from '../seed-emulators.mjs'

describe('seed-emulators', () => {
	describe('assertEmulatorsOnly', () => {
		const hosts = {
			FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
			FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000',
		}

		it('passes when both emulator hosts are set', () => {
			expect(() => assertEmulatorsOnly(hosts)).not.toThrow()
		})

		it.each(Object.keys(hosts))('refuses when %s is missing', (name) => {
			const env = { ...hosts, [name]: undefined }

			expect(() => assertEmulatorsOnly(env)).toThrow(
				new RegExp(`${name}.*live project`),
			)
		})

		it('refuses when neither is set', () => {
			expect(() => assertEmulatorsOnly({})).toThrow(/AUTH.*DATABASE/)
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

		it('has a message for the first traveller, with the fields the rules allow', () => {
			const messages = buildMessages()[SEED_USERS.TRAVELLER_ONE.uid]

			Object.values(messages).forEach((message) => {
				expect(Object.keys(message).sort()).toEqual([
					'message',
					'userEmail',
				])
			})
			expect(Object.keys(messages).length).toBeGreaterThan(0)
		})
	})
})
