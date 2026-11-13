// No imports, so the seed and backfill scripts can load it in Node without the @ alias
const firstOf = (list) => Object.values(list ?? {})[0] ?? null

// The fields anyone may read; everything else on a trip needs sign-in
export const toPublicTrip = ({
	firstName,
	lastName,
	cities,
	tripStart,
	tripEnd,
	daysInCity,
	files,
	fileDimensions,
	fileThumbnails,
	fileAlts,
} = {}) => {
	const url = firstOf(files)
	// Spread, so a last name starting with an emoji or accent pair keeps the whole character
	const [lastInitial = null] = [...(lastName?.trim() ?? '')]

	return {
		firstName: firstName?.trim() ?? null,
		lastInitial: lastInitial?.toLocaleUpperCase('en-GB') ?? null,
		cities: cities ?? null,
		tripStart: tripStart ?? null,
		tripEnd: tripEnd ?? null,
		daysInCity: daysInCity ?? null,
		cover: url
			? {
					url,
					dimensions: firstOf(fileDimensions),
					thumbnails: firstOf(fileThumbnails),
					alt: firstOf(fileAlts),
				}
			: null,
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
