#!/usr/bin/env node
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'

import { toPublicTrips } from '../src/utils/publicTrip/index.js'

const USAGE =
	'Usage: GOOGLE_APPLICATION_CREDENTIALS=<key.json> npm run public-trips:backfill [-- --write]'

// Run before deploying the rules that make /travellers sign-in only, so no trip drops out of the public list
const write = process.argv.includes('--write')
const databaseURL = process.env.VITE_BACKEND_BASE_URL

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !databaseURL) {
	console.error(
		'GOOGLE_APPLICATION_CREDENTIALS must point to a service-account key stored outside the repo, and VITE_BACKEND_BASE_URL (from .env) to the database.',
	)
	console.error(USAGE)
	process.exit(1)
}

initializeApp({ credential: applicationDefault(), databaseURL })

try {
	const db = getDatabase()
	const travellers = (await db.ref('travellers').get()).val()
	const summaries = toPublicTrips(travellers)
	const count = Object.keys(summaries).length

	if (write) {
		// set, not update, so a summary left by a deleted trip goes too
		await db.ref('publicTrips').set(summaries)
		console.log(`Wrote ${count} public trip summaries.`)
	} else {
		console.log(
			`${count} public trip summaries would be written. Re-run with -- --write to write them.`,
		)
	}
	process.exit(0)
} catch (error) {
	console.error(error.message)
	process.exit(1)
}
