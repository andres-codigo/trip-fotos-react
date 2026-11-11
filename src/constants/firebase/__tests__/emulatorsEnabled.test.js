import { emulatorsEnabled } from '@/constants/firebase'

describe('emulatorsEnabled', () => {
	const flag = { VITE_USE_FIREBASE_EMULATORS: 'true' }

	it('connects the dev server when the flag is set', () =>
		expect(
			emulatorsEnabled({ ...flag, DEV: true, MODE: 'development' }),
		).toBe(true))

	it('connects a build made in emulators mode', () =>
		expect(
			emulatorsEnabled({ ...flag, DEV: false, MODE: 'emulators' }),
		).toBe(true))

	it('never connects a production build, even with the flag set', () =>
		expect(
			emulatorsEnabled({ ...flag, DEV: false, MODE: 'production' }),
		).toBe(false))

	it('stays off without the flag', () =>
		expect(
			emulatorsEnabled({
				DEV: true,
				MODE: 'emulators',
				VITE_USE_FIREBASE_EMULATORS: 'false',
			}),
		).toBe(false))
})
