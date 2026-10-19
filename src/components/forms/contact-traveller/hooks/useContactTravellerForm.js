import { useState } from 'react'

import { VALIDATION_MESSAGES } from '@/constants/validation'
import { CONTACT_TRAVELLER_FIELDS } from '@/constants/travellers'

import { validateEmail } from '@/utils/validation'

const { EMAIL, MESSAGE } = CONTACT_TRAVELLER_FIELDS

const validateField = (id, value) => {
	if (id === EMAIL) {
		return validateEmail(value.trim())
	}

	if (id === MESSAGE && value.trim() === '') {
		return { isValid: false, message: VALIDATION_MESSAGES.MESSAGE_REQUIRED }
	}

	return { isValid: true, message: '' }
}

export const useContactTravellerForm = (initialEmail = '') => {
	const [formData, setFormData] = useState({
		[EMAIL]: { value: initialEmail, message: '', isValid: true },
		[MESSAGE]: { value: '', message: '', isValid: true },
	})

	const handleInputChange = (e) => {
		const { id, value } = e.target
		const { isValid, message } = validateField(id, value)

		setFormData((prev) => ({
			...prev,
			[id]: { ...prev[id], value, isValid, message },
		}))
	}

	const submitHandler = (onSubmitSuccess) => (e) => {
		e.preventDefault()

		const validated = Object.fromEntries(
			Object.entries(formData).map(([key, field]) => [
				key,
				{ ...field, ...validateField(key, field.value) },
			]),
		)
		setFormData(validated)

		if (Object.values(validated).some((field) => !field.isValid)) {
			return
		}

		onSubmitSuccess({
			[EMAIL]: formData[EMAIL].value.trim(),
			[MESSAGE]: formData[MESSAGE].value.trim(),
		})
	}

	return { formData, handleInputChange, submitHandler }
}
