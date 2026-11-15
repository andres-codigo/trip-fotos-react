#!/usr/bin/env node
import { pathToFileURL } from 'node:url'

import { conversationId } from '../src/utils/conversationId/index.js'

const USAGE =
	'Usage: GOOGLE_APPLICATION_CREDENTIALS=<key.json> npm run messages:migrate [-- --write]'

// One root update: each traveller's message becomes part of a conversation, an email-only one a legacy message, and /messages goes. A member whose entry already holds a newer message (a rerun, or the app sent one first) keeps it
export const toThreads = (inboxes = {}, entries = {}) => {
	const update = {}
	const latest = {}
	const unread = new Set()

	for (const [recipientId, inbox] of Object.entries(inboxes ?? {})) {
		for (const [id, item] of Object.entries(inbox ?? {})) {
			if (!item.senderId) {
				update[`legacyMessages/${recipientId}/${id}`] = {
					userEmail: item.userEmail ?? null,
					message: item.message,
				}
				continue
			}
			const cid = conversationId(item.senderId, recipientId)
			const createdAt = item.createdAt ?? 0
			update[`conversations/${cid}/messages/${id}`] = {
				senderId: item.senderId,
				message: item.message,
				createdAt,
			}
			if (item.read === false) unread.add(`${recipientId}/${cid}`)
			const current = latest[cid]
			if (!current || createdAt > current.createdAt) {
				latest[cid] = { ...item, id, createdAt }
			}
		}
	}

	for (const [cid, last] of Object.entries(latest)) {
		for (const uid of cid.split('_')) {
			if ((entries?.[uid]?.[cid]?.lastAt ?? -1) >= last.createdAt)
				continue
			const prefix = `userConversations/${uid}/${cid}`
			update[`${prefix}/otherId`] = cid
				.split('_')
				.find((member) => member !== uid)
			update[`${prefix}/lastId`] = last.id
			update[`${prefix}/lastMessage`] = last.message
			update[`${prefix}/lastSenderId`] = last.senderId
			update[`${prefix}/lastAt`] = last.createdAt
			// Older messages have no read flag and count as read
			if (!unread.has(`${uid}/${cid}`)) {
				update[`${prefix}/readAt`] = last.createdAt
			}
		}
	}

	update.messages = null
	return update
}

const count = (update, prefix, suffix = '') =>
	Object.keys(update).filter(
		(path) => path.startsWith(prefix) && path.endsWith(suffix),
	).length

// An entry is five or six paths (readAt only when read), so entries are counted by their otherId
export const summarise = (update) =>
	`${count(update, 'conversations/')} messages into ${count(update, 'userConversations/', '/otherId')} conversation entries, ${count(update, 'legacyMessages/')} email-only messages`

const run = async () => {
	const write = process.argv.includes('--write')
	const databaseURL = process.env.VITE_BACKEND_BASE_URL

	if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !databaseURL) {
		console.error(
			'GOOGLE_APPLICATION_CREDENTIALS must point to a service-account key stored outside the repo, and VITE_BACKEND_BASE_URL (from .env) to the database.',
		)
		console.error(USAGE)
		process.exit(1)
	}

	const { applicationDefault, initializeApp } =
		await import('firebase-admin/app')
	const { getDatabase } = await import('firebase-admin/database')
	initializeApp({ credential: applicationDefault(), databaseURL })

	try {
		const db = getDatabase()
		const [inboxes, entries] = await Promise.all(
			['messages', 'userConversations'].map(async (path) =>
				(await db.ref(path).get()).val(),
			),
		)
		const update = toThreads(inboxes, entries)
		const summary = summarise(update)

		if (write) {
			await db.ref().update(update)
			console.log(`Migrated ${summary}, and removed /messages.`)
		} else {
			console.log(
				`Would migrate ${summary}. Re-run with -- --write to write them.`,
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
