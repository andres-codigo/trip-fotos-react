import { isSessionValid } from '../authHelpers'

const EMAIL = 'standard@example.com'
const NOW = 1_000_000

const storage = (overrides = {}) => ({
	token: 'id-token',
	userId: 'uid-1',
	userEmail: EMAIL,
	tokenExpiration: String(NOW + 60_000),
	'firebase:authUser:demo-api-key:[DEFAULT]': JSON.stringify({
		uid: 'uid-1',
	}),
	...overrides,
})

describe('isSessionValid', () => {
	it('accepts a restored session for the same user', () =>
		expect(isSessionValid(storage(), EMAIL, NOW)).toBe(true))

	it('rejects a session with nothing restored', () =>
		expect(isSessionValid(undefined, EMAIL, NOW)).toBe(false))

	it('rejects a session without a token', () =>
		expect(isSessionValid(storage({ token: null }), EMAIL, NOW)).toBe(
			false,
		))

	it('rejects an expired token', () =>
		expect(
			isSessionValid(
				storage({ tokenExpiration: String(NOW - 1) }),
				EMAIL,
				NOW,
			),
		).toBe(false))

	it('rejects a session for another user', () =>
		expect(isSessionValid(storage(), 'other@example.com', NOW)).toBe(false))

	it('rejects a session the Auth SDK has no user for', () => {
		const restored = storage()
		delete restored['firebase:authUser:demo-api-key:[DEFAULT]']
		expect(isSessionValid(restored, EMAIL, NOW)).toBe(false)
	})

	it('rejects a session whose SDK user differs, as the app would log it out', () =>
		expect(
			isSessionValid(
				storage({
					'firebase:authUser:demo-api-key:[DEFAULT]': JSON.stringify({
						uid: 'uid-2',
					}),
				}),
				EMAIL,
				NOW,
			),
		).toBe(false))
})
