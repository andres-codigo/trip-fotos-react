import { useState } from 'react'

import { CONTACT_MESSAGE, VALIDATION_MESSAGES } from '@/constants/validation'
import { CONTACT_TRAVELLER_FIELDS } from '@/constants/travellers'

const { MESSAGE } = CONTACT_TRAVELLER_FIELDS

const validateField = (id, value) => {
	if (id === MESSAGE && value.trim() === '') {
		return { isValid: false, message: VALIDATION_MESSAGES.MESSAGE_REQUIRED }
	}

	if (id === MESSAGE && value.trim().length > CONTACT_MESSAGE.MAX_LENGTH) {
		return {
			isValid: false,
			message: VALIDATION_MESSAGES.MESSAGE_TOO_LONG(
				CONTACT_MESSAGE.MAX_LENGTH,
			),
		}
	}

	return { isValid: true, message: '' }
}

const useContactTravellerForm = () => {
	const [formData, setFormData] = useState({
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
			[MESSAGE]: formData[MESSAGE].value.trim(),
		})
	}

	return { formData, handleInputChange, submitHandler }
}

export default useContactTravellerForm
