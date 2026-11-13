import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

export const senderLabel = ({ senderStatus, senderName, userEmail }) => {
	if (senderStatus === SENDER_STATUS.LEGACY) return userEmail
	if (senderStatus === SENDER_STATUS.FORMER)
		return MESSAGES_CONFIG.FORMER_TRAVELLER
	return senderName || MESSAGES_CONFIG.UNKNOWN_TRAVELLER
}
