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

export const formatClockTime = (time) =>
	new Date(time).toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	})

const datePart = (parts, type) => parts.find((part) => part.type === type).value

export const formatDayLabel = (time, now = Date.now()) => {
	const day = startOfDay(time)
	const today = startOfDay(now)
	if (day === today) return 'Today'

	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	if (day === yesterday.getTime()) return 'Yesterday'

	const date = new Date(time)
	if (date.getFullYear() !== new Date(now).getFullYear()) {
		return date.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		})
	}

	// Built from parts: some ICU versions put a comma after the weekday
	const parts = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	}).formatToParts(date)
	return ['weekday', 'day', 'month']
		.map((type) => datePart(parts, type))
		.join(' ')
}
