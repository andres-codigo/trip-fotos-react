#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const USAGE =
	'Usage: GOOGLE_APPLICATION_CREDENTIALS=<key.json> npm run accounts:mark-verified [-- --write]'

// When sign-up started sending the verification email (0.28.0); accounts made since were asked to verify, older ones never were
export const VERIFICATION_RELEASED_AT = '2026-11-15T18:42:45Z'

export const accountsToVerify = (
	users,
	releasedAt = VERIFICATION_RELEASED_AT,
) =>
	users.filter(
		({ emailVerified, disabled, metadata }) =>
			!emailVerified &&
			!disabled &&
			new Date(metadata.creationTime) < new Date(releasedAt),
	)

const listAllUsers = async (auth) => {
	const users = []
	let pageToken
	do {
		const page = await auth.listUsers(1000, pageToken)
		users.push(...page.users)
		pageToken = page.pageToken
	} while (pageToken)
	return users
}

// Run before deploying the rules that require a verified email, so current travellers are not locked out
const run = async () => {
	const write = process.argv.includes('--write')

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
		const accounts = accountsToVerify(await listAllUsers(auth))

		if (write) {
			for (const { uid } of accounts) {
				await auth.updateUser(uid, { emailVerified: true })
			}
			console.log(`Marked ${accounts.length} accounts verified.`)
		} else {
			accounts.forEach(({ email, metadata }) =>
				console.log(`${email}  created ${metadata.creationTime}`),
			)
			console.log(
				`Would mark ${accounts.length} accounts verified. Re-run with -- --write to write them.`,
			)
		}
		process.exit(0)
	} catch (error) {
		console.error(error.message)
		process.exit(1)
	}
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	await run()
}
