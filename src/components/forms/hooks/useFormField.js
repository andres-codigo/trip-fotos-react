import { useState } from 'react'

const useFormField = (initialValue = '') => {
	const [field, setField] = useState({
		value: initialValue,
		isValid: true,
		message: '',
	})

	const updateField = (value, isValid = true, message = '') => {
		setField({ value, isValid, message })
	}

	return [field, updateField]
}

export default useFormField
