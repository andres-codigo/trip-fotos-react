import { describe, expect, it } from 'vitest'

import {
	VERIFICATION_RELEASED_AT,
	accountsToVerify,
} from '../mark-accounts-verified.mjs'

const BEFORE = 'Sat, 14 Nov 2026 09:00:00 GMT'
const AFTER = 'Mon, 16 Nov 2026 09:00:00 GMT'

const account = (uid, creationTime, fields = {}) => ({
	uid,
	email: `${uid}@example.com`,
	emailVerified: false,
	disabled: false,
	metadata: { creationTime },
	...fields,
})

describe('accountsToVerify', () => {
	it('picks unverified accounts created before sign-up started asking for verification', () => {
		const users = [account('older', BEFORE), account('newer', AFTER)]

		expect(accountsToVerify(users).map(({ uid }) => uid)).toEqual(['older'])
	})

	it('leaves accounts that are already verified or disabled', () => {
		const users = [
			account('verified', BEFORE, { emailVerified: true }),
			account('disabled', BEFORE, { disabled: true }),
		]

		expect(accountsToVerify(users)).toEqual([])
	})

	it('treats an account made at the release time as new', () => {
		const users = [
			account(
				'at-release',
				new Date(VERIFICATION_RELEASED_AT).toUTCString(),
			),
		]

		expect(accountsToVerify(users)).toEqual([])
	})
})
