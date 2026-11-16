import { hasSdkSession } from '../authHelpers'

const EMAIL = 'Standard@example.com'
const SDK_KEY = 'firebase:authUser:demo-api-key:[DEFAULT]'

const storage = (user = {}) => ({
	[SDK_KEY]: JSON.stringify({
		uid: 'uid-1',
		email: 'standard@example.com',
		stsTokenManager: {
			refreshToken: 'refresh-token',
			// Long past: the SDK renews it, so an old ID token is still a session
			expirationTime: 1,
		},
		...user,
	}),
})

describe('hasSdkSession', () => {
	it('accepts a restored SDK user for the same address, in any case', () =>
		expect(hasSdkSession(storage(), EMAIL)).toBe(true))

	it('rejects a session with nothing restored', () =>
		expect(hasSdkSession(undefined, EMAIL)).toBe(false))

	it('rejects storage without an SDK user', () =>
		expect(hasSdkSession({ unrelated: 'value' }, EMAIL)).toBe(false))

	it('rejects an SDK user without a refresh token', () =>
		expect(hasSdkSession(storage({ stsTokenManager: {} }), EMAIL)).toBe(
			false,
		))

	it('rejects a session for another user', () =>
		expect(hasSdkSession(storage(), 'other@example.com')).toBe(false))
})
