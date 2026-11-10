// UI_CHECK_ONLY: comma-separated parts of capture test names, case-insensitive; empty runs every test
export const parseOnly = (only) =>
	String(only ?? '')
		.split(',')
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean)

export const runsCapture = (parts, title) =>
	!parts.length || parts.some((part) => title.toLowerCase().includes(part))
