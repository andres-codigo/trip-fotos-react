import { describe, expect, it } from 'vitest'

import { toThreads } from '../migrate-messages-to-threads.mjs'

const ME = 'uid-a'
const OTHER = 'uid-b'
const CID = `${ME}_${OTHER}`

describe('toThreads', () => {
	it('moves a traveller message into the shared conversation, keeping its time', () => {
		const update = toThreads({
			[ME]: {
				m1: {
					senderId: OTHER,
					message: 'Hi',
					createdAt: 10,
					read: true,
				},
			},
		})

		expect(update[`conversations/${CID}/messages/m1`]).toEqual({
			senderId: OTHER,
			message: 'Hi',
			createdAt: 10,
		})
	})

	it('gives both members an entry for the latest message, whichever inbox it was in', () => {
		const update = toThreads({
			[ME]: {
				m1: {
					senderId: OTHER,
					message: 'Hi',
					createdAt: 10,
					read: true,
				},
			},
			[OTHER]: {
				m2: {
					senderId: ME,
					message: 'Hello',
					createdAt: 20,
					read: true,
				},
			},
		})

		for (const [uid, otherId] of [
			[ME, OTHER],
			[OTHER, ME],
		]) {
			const prefix = `userConversations/${uid}/${CID}`
			expect(update[`${prefix}/otherId`]).toBe(otherId)
			expect(update[`${prefix}/lastId`]).toBe('m2')
			expect(update[`${prefix}/lastMessage`]).toBe('Hello')
			expect(update[`${prefix}/lastSenderId`]).toBe(ME)
			expect(update[`${prefix}/lastAt`]).toBe(20)
		}
	})

	it('leaves a conversation with an unread message unread for its recipient only', () => {
		const update = toThreads({
			[ME]: {
				m1: {
					senderId: OTHER,
					message: 'Hi',
					createdAt: 10,
					read: false,
				},
			},
		})

		expect(update[`userConversations/${ME}/${CID}/readAt`]).toBeUndefined()
		expect(update[`userConversations/${OTHER}/${CID}/readAt`]).toBe(10)
	})

	it('treats a message with no read flag as read', () => {
		const update = toThreads({
			[ME]: { m1: { senderId: OTHER, message: 'Hi', createdAt: 10 } },
		})

		expect(update[`userConversations/${ME}/${CID}/readAt`]).toBe(10)
	})

	it('keeps an email-only message as a legacy message, outside any conversation', () => {
		const update = toThreads({
			[ME]: { m1: { userEmail: 'old@example.com', message: 'Hi' } },
		})

		expect(update[`legacyMessages/${ME}/m1`]).toEqual({
			userEmail: 'old@example.com',
			message: 'Hi',
		})
		expect(
			Object.keys(update).filter((path) => path.startsWith('conv')),
		).toEqual([])
	})

	it('removes /messages in the same update, even when it is empty', () => {
		expect(toThreads(null)).toEqual({ messages: null })
	})
})
