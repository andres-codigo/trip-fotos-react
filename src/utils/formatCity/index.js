import { TRAVELLER_REGISTRATION_CITIES } from '@/constants/travellers'

export const formatCity = (city, { withRegion = false } = {}) => {
	if (!city) return ''

	if (typeof city === 'string') {
		return (
			TRAVELLER_REGISTRATION_CITIES.find(({ id }) => id === city)
				?.label ?? city
		)
	}

	return [city.city, withRegion ? city.region : null, city.country]
		.filter(Boolean)
		.join(', ')
}

export const getCityId = (city) => (typeof city === 'string' ? city : city?.id)
