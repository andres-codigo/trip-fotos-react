const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// Thread content shared by the slice tests and the emulator seed; `fromOther` and `ago` are resolved against each one's users and clock
export const MOCK_THREADS = Object.freeze({
	OTHER_ID: 'mock-sender-id',
	FORMER_ID: 'mock-former-id',
	// Both sides wrote; the other traveller wrote last, so it is unread
	TWO_SIDED: Object.freeze([
		Object.freeze({
			id: '-OSeedThread00000001',
			fromOther: true,
			message: 'Hello, I love your photos of Lisbon.',
			ago: 26 * HOUR,
		}),
		Object.freeze({
			id: '-OSeedThread00000002',
			fromOther: false,
			message: 'Thank you! It was my favourite stop of the trip.',
			ago: 25 * HOUR,
		}),
		Object.freeze({
			id: '-OSeedThread00000003',
			fromOther: true,
			message: 'Any tips for a first visit to Porto?',
			ago: 12 * MINUTE,
		}),
	]),
	// From a traveller who has since deleted their card, already read
	FORMER: Object.freeze([
		Object.freeze({
			id: '-OSeedThread00000004',
			fromOther: true,
			message: 'Your Tokyo photos made me book a flight.',
			ago: 72 * HOUR,
		}),
	]),
	// Sent before messaging was travellers-only: an email and no sender, time or read flag
	LEGACY: Object.freeze({
		id: 'message-two',
		userEmail: 'sender-two@example.com',
		message: 'Any tips for visiting Porto?',
	}),
})

// A conversation summary as the list holds it; unread when the other member wrote after it was read
export const mockConversationSummary = (id, isUnread = false) =>
	Object.freeze({
		id,
		otherId: MOCK_THREADS.OTHER_ID,
		otherName: 'Jane Smith',
		otherStatus: 'traveller',
		otherPlace: null,
		lastId: `${id}-last`,
		lastMessage: 'Hello',
		lastSenderId: MOCK_THREADS.OTHER_ID,
		lastAt: 2,
		readAt: isUnread ? null : 3,
		clearedAt: null,
	})
