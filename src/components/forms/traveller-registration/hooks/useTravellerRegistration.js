import { useCallback, useState } from 'react'

import { VALIDATION_MESSAGES } from '@/constants/validation'
import { TRAVELLER_REGISTRATION_FIELDS } from '@/constants/travellers'

import { getCityId } from '@/utils/formatCity'

export const useTravellerRegistration = () => {
	const { FIRST_NAME, LAST_NAME, DESCRIPTION, DAYS, CITIES, FILES } =
		TRAVELLER_REGISTRATION_FIELDS

	const [formData, setFormData] = useState({
		[FIRST_NAME]: { value: '', message: '', isValid: true },
		[LAST_NAME]: { value: '', message: '', isValid: true },
		[DESCRIPTION]: { value: '', message: '', isValid: true },
		[DAYS]: { value: '', message: '', isValid: true },
		[CITIES]: { value: [], message: '', isValid: true },
	})
	const [files, setFiles] = useState([])

	const handleFilesUpdated = useCallback((updatedFiles) => {
		setFiles(updatedFiles)
	}, [])

	const validateField = (id, value) => {
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

		if (id === DESCRIPTION && value.trim() === '') {
			return {
				isValid: false,
				message: VALIDATION_MESSAGES.DESCRIPTION_REQUIRED,
			}
		}

		if (id === DAYS && (!value || Number(value) <= 0)) {
			return {
				isValid: false,
				message: VALIDATION_MESSAGES.DAYS_REQUIRED,
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
		const { isValid, message } = validateField(id, value)

		setFormData((prev) => ({
			...prev,
			[id]: { ...prev[id], value, isValid, message },
		}))
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
			const { isValid, message } = validateField(key, value)

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
			[DESCRIPTION]: formData[DESCRIPTION].value,
			daysInCity: formData[DAYS].value,
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
