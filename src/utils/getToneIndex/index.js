export const TONE_COUNT = 8

// Deterministic, so a city keeps its colour across renders, pages and sessions
export const getToneIndex = (type) => {
	let hash = 0
	for (const char of type) {
		hash = (hash * 31 + char.charCodeAt(0)) % 2147483647
	}
	return hash % TONE_COUNT
}
