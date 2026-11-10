import { TRAVELLER_REGISTRATION_CITIES } from '@/constants/travellers'

// Ids and hand-entered names can arrive lower case or hyphenated ("krakow", "new-york"); a word the source already capitalised ("McLeod") is kept
const toDisplayCase = (text) =>
	String(text)
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(
			/(^|\s)(\p{Ll})/gu,
			(_, space, letter) =>
				`${space}${letter.toLocaleUpperCase('en-GB')}`,
		)

export const formatCity = (city, { withRegion = false } = {}) => {
	if (!city) return ''

	if (typeof city === 'string') {
		return (
			TRAVELLER_REGISTRATION_CITIES.find(({ id }) => id === city)
				?.label ?? toDisplayCase(city)
		)
	}

	return [city.city, withRegion ? city.region : null, city.country]
		.filter(Boolean)
		.map(toDisplayCase)
		.join(', ')
}

export const getCityId = (city) => (typeof city === 'string' ? city : city?.id)
