import { useState } from 'react'

import { VALIDATION_MESSAGES } from '@/constants/validation'

export const useTravellerRegistration = () => {
	const [formData, setFormData] = useState({
		firstName: { value: '', message: '', isValid: true },
		lastName: { value: '', message: '', isValid: true },
		description: { value: '', message: '', isValid: true },
		days: { value: '', message: '', isValid: true },
		cities: { value: [], message: '', isValid: true },
	})

	const validateField = (id, value) => {
		let isValid = true
		let message = ''

		if (id === 'firstName' && value.trim() === '') {
			isValid = false
			message = VALIDATION_MESSAGES.FIRST_NAME_REQUIRED
		} else if (id === 'lastName' && value.trim() === '') {
			isValid = false
			message = VALIDATION_MESSAGES.LAST_NAME_REQUIRED
		} else if (id === 'description' && value.trim() === '') {
			isValid = false
			message = VALIDATION_MESSAGES.DESCRIPTION_REQUIRED
		} else if (id === 'days' && (!value || Number(value) <= 0)) {
			isValid = false
			message = VALIDATION_MESSAGES.DAYS_REQUIRED
		} else if (id === 'cities' && value.length === 0) {
			isValid = false
			message = VALIDATION_MESSAGES.CITIES_REQUIRED
		}

		return { isValid, message }
	}

	const handleInputChange = (e) => {
		const { id, value } = e.target
		const { isValid, message } = validateField(id, value)

		setFormData((prev) => ({
			...prev,
			[id]: { ...prev[id], value, isValid, message },
		}))
	}

	const handleCheckboxChange = (e) => {
		const { value, checked } = e.target
		setFormData((prev) => {
			const currentCities = prev.cities.value
			let newCities
			if (checked) {
				newCities = [...currentCities, value]
			} else {
				newCities = currentCities.filter((city) => city !== value)
			}

			const isValid = newCities.length > 0
			const message = isValid ? '' : VALIDATION_MESSAGES.CITIES_REQUIRED

			return {
				...prev,
				cities: { ...prev.cities, value: newCities, isValid, message },
			}
		})
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
			firstName: formData.firstName.value,
			lastName: formData.lastName.value,
			description: formData.description.value,
			daysInCity: formData.days.value,
			cities: formData.cities.value,
			// files: [], // TODO: Implement file upload
		}
		console.log('Form Submitted', dataToSubmit)
		// TODO: Emit/Dispatch event
		if (onSubmitSuccess) {
			onSubmitSuccess(dataToSubmit)
		}
	}

	return {
		formData,
		handleInputChange,
		handleCheckboxChange,
		submitHandler,
	}
}
