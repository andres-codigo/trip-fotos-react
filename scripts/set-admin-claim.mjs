#!/usr/bin/env node
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const USAGE =
	'Usage: GOOGLE_APPLICATION_CREDENTIALS=<key.json> node scripts/set-admin-claim.mjs <email> [--remove]'

const args = process.argv.slice(2)
const remove = args.includes('--remove')
const email = args.find((arg) => !arg.startsWith('--'))

if (!email) {
	console.error(USAGE)
	process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
	console.error(
		'GOOGLE_APPLICATION_CREDENTIALS must point to a service-account key stored outside the repo.',
	)
	console.error(USAGE)
	process.exit(1)
}

initializeApp({ credential: applicationDefault() })

try {
	const auth = getAuth()
	const user = await auth.getUserByEmail(email)
	// Merge so other custom claims on the account survive
	const claims = { ...user.customClaims, admin: !remove }
	if (remove) delete claims.admin

	await auth.setCustomUserClaims(user.uid, claims)
	console.log(
		`${remove ? 'Removed' : 'Granted'} admin for ${email} (${user.uid}). They must sign out and in again for it to apply.`,
	)
} catch (error) {
	console.error(error.message)
	process.exit(1)
}
