// No imports, so the seed and backfill scripts can load it in Node without the @ alias
// The database stores a list as an object and drops its null entries, so read by key, never by position
const atIndex = (list, index) => list?.[index] ?? null

const PUBLIC_PHOTO_LIMIT = 3
// The rules refuse a longer excerpt, so keep the two in step
export const PUBLIC_EXCERPT_LIMIT = 200

// The opening of the description on one line, so the card's two-line clamp shows as much text as it can
const toExcerpt = (description) => {
	const text = description?.replace(/\s+/g, ' ').trim() ?? ''
	// Cutting in the middle of an emoji would leave half of it, so drop a stray high surrogate
	const excerpt = text
		.slice(0, PUBLIC_EXCERPT_LIMIT)
		.replace(/[\uD800-\uDBFF]$/, '')
		.trimEnd()

	return excerpt || null
}

// The fields anyone may read; everything else on a trip needs sign-in
export const toPublicTrip = ({
	firstName,
	lastName,
	tripDescription,
	cities,
	tripStart,
	tripEnd,
	daysInCity,
	files,
	fileDimensions,
	fileThumbnails,
	fileAlts,
} = {}) => {
	// The first photos in upload order, each with its own size, thumbnails and description
	const photos = Object.values(files ?? {})
		.slice(0, PUBLIC_PHOTO_LIMIT)
		.map((url, index) => ({
			url,
			dimensions: atIndex(fileDimensions, index),
			thumbnails: atIndex(fileThumbnails, index),
			alt: atIndex(fileAlts, index),
		}))
	// Spread, so a last name starting with an emoji or accent pair keeps the whole character
	const [lastInitial = null] = [...(lastName?.trim() ?? '')]

	return {
		firstName: firstName?.trim() ?? null,
		lastInitial: lastInitial?.toLocaleUpperCase('en-GB') ?? null,
		tripExcerpt: toExcerpt(tripDescription),
		cities: cities ?? null,
		tripStart: tripStart ?? null,
		tripEnd: tripEnd ?? null,
		daysInCity: daysInCity ?? null,
		photos: photos.length ? photos : null,
	}
}

export const publicName = ({ firstName, lastInitial }) =>
	lastInitial ? `${firstName} ${lastInitial}.` : firstName

// Newest trip first; a trip with no start date (an older record with only a length) goes last
export const byNewestTrip = (a, b) =>
	(b.tripStart ?? '').localeCompare(a.tripStart ?? '')

// The whole /publicTrips node for a /travellers snapshot, as the seed and backfill scripts write it
export const toPublicTrips = (travellers) =>
	Object.fromEntries(
		Object.entries(travellers ?? {}).map(([id, traveller]) => [
			id,
			toPublicTrip(traveller),
		]),
	)
