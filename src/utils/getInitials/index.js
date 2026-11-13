const getWords = (name) => name.trim().split(/\s+/).filter(Boolean)

// First letter of the first word, plus the last word's when there are two or more
export const getInitials = (name) => {
	const words = getWords(name)
	if (words.length === 0) return ''
	const last = words.length > 1 ? words[words.length - 1][0] : ''
	return `${words[0][0]}${last}`.toUpperCase()
}
