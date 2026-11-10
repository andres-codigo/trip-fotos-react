const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY = 24 * 60 * 60 * 1000

// Trip dates are calendar days with no time zone, so they are read as UTC to keep "12 Mar" the same for every viewer
export const parseIsoDate = (value) => {
	const match = ISO_DATE.exec(value ?? '')
	if (!match) return null

	const [year, month, day] = match.slice(1).map(Number)
	const time = Date.UTC(year, month - 1, day)
	const date = new Date(time)

	if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		return null
	}

	return { year, month, day, time }
}

export const toIsoDate = (date) =>
	[
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, '0'),
		String(date.getDate()).padStart(2, '0'),
	].join('-')

export const getTripLength = (tripStart, tripEnd) => {
	const start = parseIsoDate(tripStart)
	const end = parseIsoDate(tripEnd)
	if (!start || !end || end.time < start.time) return null

	return Math.round((end.time - start.time) / DAY) + 1
}

const monthName = ({ time }) =>
	new Date(time).toLocaleDateString('en-GB', {
		month: 'short',
		timeZone: 'UTC',
	})

export const formatTripRange = (tripStart, tripEnd) => {
	const start = parseIsoDate(tripStart)
	const end = parseIsoDate(tripEnd)
	if (!start || !end) return ''

	const startMonth = monthName(start)
	const endMonth = monthName(end)

	if (tripStart === tripEnd) return `${start.day} ${startMonth} ${start.year}`
	if (start.year !== end.year) {
		return `${start.day} ${startMonth} ${start.year} – ${end.day} ${endMonth} ${end.year}`
	}
	if (start.month !== end.month) {
		return `${start.day} ${startMonth} – ${end.day} ${endMonth} ${end.year}`
	}
	return `${start.day}–${end.day} ${endMonth} ${end.year}`
}

export const formatTripDays = (days) => `${days} ${days === 1 ? 'day' : 'days'}`

// Older travellers have only daysInCity (sometimes stored as a string); a traveller with neither has no summary
export const getTripSummary = ({ tripStart, tripEnd, daysInCity } = {}) => {
	const days = getTripLength(tripStart, tripEnd)
	if (days) {
		return { range: formatTripRange(tripStart, tripEnd), days }
	}

	const legacyDays = Number(daysInCity)
	if (Number.isInteger(legacyDays) && legacyDays > 0) {
		return { range: '', days: legacyDays }
	}

	return null
}
