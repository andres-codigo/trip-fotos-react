export const MOCK_INBOX = Object.freeze({
	TRAVELLER_ID: 'mock-traveller-id',
	NEW_MESSAGE_ID: 'mock-new-message-id',
	// A message from a traveller, unread
	SAMPLE_MESSAGE_ONE: Object.freeze({
		id: 'message-one',
		travellerId: 'mock-user-id',
		senderId: 'mock-sender-id',
		senderName: 'Jane Smith',
		senderStatus: 'traveller',
		userEmail: null,
		message: 'Hello, I love your photos of Lisbon.',
		createdAt: 1794290000000,
		read: false,
	}),
	// An older message, sent before messaging was travellers-only: an email and no sender id, time or read flag
	SAMPLE_MESSAGE_TWO: Object.freeze({
		id: 'message-two',
		travellerId: 'mock-user-id',
		senderId: null,
		senderName: null,
		senderStatus: 'legacy',
		userEmail: 'sender-two@example.com',
		message: 'Any tips for visiting Porto?',
		createdAt: null,
		read: true,
	}),
})
