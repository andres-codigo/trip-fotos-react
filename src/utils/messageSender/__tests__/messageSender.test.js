import { describe, it, expect } from 'vitest'

import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { senderLabel } from '@/utils/messageSender'

describe('senderLabel', () => {
	it('names a traveller by their card name', () => {
		expect(
			senderLabel({
				senderStatus: SENDER_STATUS.TRAVELLER,
				senderName: 'Jane Smith',
			}),
		).toBe('Jane Smith')
	})

	it('falls back to "A traveller" when the name is missing', () => {
		expect(senderLabel({ senderStatus: SENDER_STATUS.UNKNOWN })).toBe(
			MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
		)
	})

	it('names a former traveller without their old name', () => {
		expect(
			senderLabel({
				senderStatus: SENDER_STATUS.FORMER,
				senderName: 'Jane Smith',
			}),
		).toBe(MESSAGES_CONFIG.FORMER_TRAVELLER)
	})

	it('shows the email of an older email-only message', () => {
		expect(
			senderLabel({
				senderStatus: SENDER_STATUS.LEGACY,
				userEmail: 'old.friend@example.com',
			}),
		).toBe('old.friend@example.com')
	})
})
