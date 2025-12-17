import { useState } from 'react'

export const useTravellerRegistration = () => {
	const [formData, setFormData] = useState({
		firstName: { val: '', isValid: true },
		lastName: { val: '', isValid: true },
		description: { val: '', isValid: true },
		days: { val: '', isValid: true },
		areas: { val: [], isValid: true },
	})
	const [formIsValid, setFormIsValid] = useState(true)

	const handleInputChange = (e) => {
		const { id, value } = e.target
		setFormData((prev) => ({
			...prev,
			[id]: { ...prev[id], val: value, isValid: true },
		}))
	}

	const handleCheckboxChange = (e) => {
		const { value, checked } = e.target
		setFormData((prev) => {
			const currentAreas = prev.areas.val
			let newAreas
			if (checked) {
				newAreas = [...currentAreas, value]
			} else {
				newAreas = currentAreas.filter((area) => area !== value)
			}
			return {
				...prev,
				areas: { ...prev.areas, val: newAreas, isValid: true },
			}
		})
	}

	const validateForm = () => {
		let isValid = true
		const newFormData = { ...formData }

		if (newFormData.firstName.val.trim() === '') {
			newFormData.firstName.isValid = false
			isValid = false
		}
		if (newFormData.lastName.val.trim() === '') {
			newFormData.lastName.isValid = false
			isValid = false
		}
		if (newFormData.description.val.trim() === '') {
			newFormData.description.isValid = false
			isValid = false
		}
		if (!newFormData.days.val || Number(newFormData.days.val) <= 0) {
			newFormData.days.isValid = false
			isValid = false
		}
		if (newFormData.areas.val.length === 0) {
			newFormData.areas.isValid = false
			isValid = false
		}

		setFormData(newFormData)
		setFormIsValid(isValid)
		return isValid
	}

	const submitHandler = (e) => {
		e.preventDefault()
		
		const isValid = validateForm()
		if (!isValid) {
			return
		}

		const dataToSubmit = {
			first: formData.firstName.val,
			last: formData.lastName.val,
			desc: formData.description.val,
			days: formData.days.val,
			areas: formData.areas.val,
			// files: [], // TODO: Implement file upload
		}
		console.log('Form Submitted', dataToSubmit)
		// TODO: Emit/Dispatch event
	}

	return {
		formData,
		formIsValid,
		handleInputChange,
		handleCheckboxChange,
		submitHandler,
	}
}
