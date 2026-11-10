const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

const startOfDay = (time) => {
	const date = new Date(time)
	date.setHours(0, 0, 0, 0)
	return date.getTime()
}

export const formatFullTime = (time) =>
	new Date(time).toLocaleString('en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short',
	})

export const formatMessageTime = (time, now = Date.now()) => {
	const elapsed = Math.max(0, now - time)

	if (elapsed < MINUTE) return 'Just now'
	if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`
	if (elapsed < 24 * HOUR && startOfDay(time) === startOfDay(now)) {
		return `${Math.floor(elapsed / HOUR)} h ago`
	}

	const yesterday = new Date(startOfDay(now))
	yesterday.setDate(yesterday.getDate() - 1)
	if (startOfDay(time) === yesterday.getTime()) return 'Yesterday'

	return new Date(time).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
}
