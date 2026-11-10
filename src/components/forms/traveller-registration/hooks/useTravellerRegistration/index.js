import { useCallback, useState } from 'react'

import { VALIDATION_MESSAGES } from '@/constants/validation'
import {
	TRAVELLER_REGISTRATION_FIELDS,
	TRIP_DATES_CONFIG,
} from '@/constants/travellers'

import { getCityId } from '@/utils/formatCity'
import { getTripLength, parseIsoDate, toIsoDate } from '@/utils/tripDates'

const VALID = { isValid: true, message: '' }
const invalid = (message) => ({ isValid: false, message })

const validateTripDate = (value, requiredMessage, today) => {
	if (!parseIsoDate(value)) return invalid(requiredMessage)
	// ISO dates compare correctly as text
	if (value > today) return invalid(VALIDATION_MESSAGES.TRIP_DATE_IN_FUTURE)
	return VALID
}

const validateTripEnd = (tripEnd, tripStart, today) => {
	const endState = validateTripDate(
		tripEnd,
		VALIDATION_MESSAGES.TRIP_END_REQUIRED,
		today,
	)
	// The order is only worth checking against a start date that is itself valid, or one mistake shows two errors
	if (!endState.isValid || !parseIsoDate(tripStart) || tripStart > today) {
		return endState
	}

	const days = getTripLength(tripStart, tripEnd)
	if (!days) return invalid(VALIDATION_MESSAGES.TRIP_END_BEFORE_START)
	if (days > TRIP_DATES_CONFIG.MAX_DAYS) {
		return invalid(
			VALIDATION_MESSAGES.TRIP_TOO_LONG(TRIP_DATES_CONFIG.MAX_DAYS),
		)
	}
	return VALID
}

const useTravellerRegistration = () => {
	const {
		FIRST_NAME,
		LAST_NAME,
		TRIP_DESCRIPTION,
		TRIP_START,
		TRIP_END,
		CITIES,
		FILES,
	} = TRAVELLER_REGISTRATION_FIELDS

	const [formData, setFormData] = useState({
		[FIRST_NAME]: { value: '', message: '', isValid: true },
		[LAST_NAME]: { value: '', message: '', isValid: true },
		[TRIP_DESCRIPTION]: { value: '', message: '', isValid: true },
		[TRIP_START]: { value: '', message: '', isValid: true },
		[TRIP_END]: { value: '', message: '', isValid: true },
		[CITIES]: { value: [], message: '', isValid: true },
	})
	const [files, setFiles] = useState([])

	const handleFilesUpdated = useCallback((updatedFiles) => {
		setFiles(updatedFiles)
	}, [])

	const validateField = (id, value, data = formData) => {
		const today = toIsoDate(new Date())

		if (id === TRIP_START) {
			return validateTripDate(
				value,
				VALIDATION_MESSAGES.TRIP_START_REQUIRED,
				today,
			)
		}

		if (id === TRIP_END) {
			return validateTripEnd(value, data[TRIP_START].value, today)
		}

		if (id === FIRST_NAME && value.trim() === '') {
			return {
				isValid: false,
				message: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
			}
		}

		if (id === LAST_NAME && value.trim() === '') {
			return {
				isValid: false,
				message: VALIDATION_MESSAGES.LAST_NAME_REQUIRED,
			}
		}

		if (id === TRIP_DESCRIPTION && value.trim() === '') {
			return {
				isValid: false,
				message: VALIDATION_MESSAGES.TRIP_DESCRIPTION_REQUIRED,
			}
		}

		if (id === CITIES && value.length === 0) {
			return {
				isValid: false,
				message: VALIDATION_MESSAGES.CITIES_REQUIRED,
			}
		}

		return {
			isValid: true,
			message: '',
		}
	}

	const handleInputChange = (e) => {
		const { id, value } = e.target

		setFormData((prev) => {
			const next = {
				...prev,
				[id]: { ...prev[id], value, ...validateField(id, value, prev) },
			}

			// A new start date can make or clear an end-date error, but an untouched end date stays quiet
			if (id === TRIP_START && prev[TRIP_END].value) {
				next[TRIP_END] = {
					...prev[TRIP_END],
					...validateField(TRIP_END, prev[TRIP_END].value, next),
				}
			}

			return next
		})
	}

	const updateCities = (getNextCities) => {
		setFormData((prev) => {
			const newCities = getNextCities(prev[CITIES].value)
			const isValid = newCities.length > 0
			const message = isValid ? '' : VALIDATION_MESSAGES.CITIES_REQUIRED

			return {
				...prev,
				[CITIES]: {
					...prev[CITIES],
					value: newCities,
					isValid,
					message,
				},
			}
		})
	}

	const handleCitiesBlur = () => {
		updateCities((cities) => cities)
	}

	const handleCityAdd = (city) => {
		updateCities((cities) =>
			cities.some((existing) => getCityId(existing) === city.id)
				? cities
				: [...cities, city],
		)
	}

	const handleCityRemove = (cityId) => {
		updateCities((cities) =>
			cities.filter((city) => getCityId(city) !== cityId),
		)
	}

	const validateForm = () => {
		let isFormValid = true
		const newFormData = { ...formData }

		Object.keys(newFormData).forEach((key) => {
			const { value } = newFormData[key]
			const { isValid, message } = validateField(key, value, formData)

			if (!isValid) {
				isFormValid = false
				newFormData[key] = { ...newFormData[key], isValid, message }
			}
		})

		setFormData(newFormData)
		return isFormValid
	}

	const submitHandler = (onSubmitSuccess) => (e) => {
		e.preventDefault()

		const isValid = validateForm()
		if (!isValid) {
			return
		}

		const dataToSubmit = {
			[FIRST_NAME]: formData[FIRST_NAME].value,
			[LAST_NAME]: formData[LAST_NAME].value,
			[TRIP_DESCRIPTION]: formData[TRIP_DESCRIPTION].value,
			[TRIP_START]: formData[TRIP_START].value,
			[TRIP_END]: formData[TRIP_END].value,
			[CITIES]: formData[CITIES].value,
			[FILES]: files,
		}

		if (onSubmitSuccess) {
			onSubmitSuccess(dataToSubmit)
		}
	}

	return {
		formData,
		handleInputChange,
		handleCityAdd,
		handleCityRemove,
		handleCitiesBlur,
		handleFilesUpdated,
		submitHandler,
	}
}

export default useTravellerRegistration
