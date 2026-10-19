export const MOCK_INBOX = Object.freeze({
	TRAVELLER_ID: 'mock-traveller-id',
	NEW_MESSAGE_ID: 'mock-new-message-id',
	SAMPLE_MESSAGE_ONE: Object.freeze({
		id: 'message-one',
		travellerId: 'mock-user-id',
		userEmail: 'sender-one@example.com',
		message: 'Hello, I love your photos of Lisbon.',
	}),
	SAMPLE_MESSAGE_TWO: Object.freeze({
		id: 'message-two',
		travellerId: 'mock-user-id',
		userEmail: 'sender-two@example.com',
		message: 'Any tips for visiting Porto?',
	}),
})
