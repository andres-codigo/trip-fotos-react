import { useState } from 'react'
import styles from './TravellerRegistrationForm.module.scss'

import { VALIDATION_MESSAGES } from '@/constants/validation/messages'

import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import BaseButton from '@/components/ui/button/BaseButton'

const TravellerRegistrationForm = () => {
	const [formData, setFormData] = useState({
		firstName: { val: '', isValid: true },
		lastName: { val: '', isValid: true },
		description: { val: '', isValid: true },
		days: { val: '', isValid: true },
		areas: { val: [], isValid: true },
	})
	const [formIsValid, setFormIsValid] = useState(true)

	const areas = [
		{ id: 'tokyo', label: 'Tokyo, Japan' },
		{ id: 'prague', label: 'Prague, Czechia' },
		{ id: 'sydney', label: 'Sydney, Australia' },
		{ id: 'canberra', label: 'Canberra, Australia' },
	]

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

	const handleSubmit = (e) => {
		e.preventDefault()
		if (validateForm()) {
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
	}

	return (
		<form
			className={styles.form}
			onSubmit={handleSubmit}
			data-cy="traveller-registration-form">
			<div
				className={`${styles.formControl} ${!formData.firstName.isValid ? styles.invalid : ''}`}>
				<Input
					id="firstName"
					label="First name"
					value={formData.firstName.val}
					onChange={handleInputChange}
					isValid={formData.firstName.isValid}
					message={VALIDATION_MESSAGES.FIRST_NAME_REQUIRED}
					data-cy="input-first-name"
				/>
			</div>

			<div
				className={`${styles.formControl} ${!formData.lastName.isValid ? styles.invalid : ''}`}>
				<Input
					id="lastName"
					label="Last name"
					value={formData.lastName.val}
					onChange={handleInputChange}
					isValid={formData.lastName.isValid}
					message={VALIDATION_MESSAGES.LAST_NAME_REQUIRED}
					data-cy="input-last-name"
				/>
			</div>

			<div
				className={`${styles.formControl} ${!formData.description.isValid ? styles.invalid : ''}`}>
				<Textarea
					id="description"
					label="Description"
					rows={5}
					value={formData.description.val}
					onChange={handleInputChange}
					isValid={formData.description.isValid}
					message={VALIDATION_MESSAGES.DESCRIPTION_REQUIRED}
					data-cy="input-description"
				/>
			</div>

			<div
				className={`${styles.formControl} ${!formData.days.isValid ? styles.invalid : ''}`}>
				<Input
					id="days"
					label="Number of days spent in the city?"
					type="number"
					value={formData.days.val}
					onChange={handleInputChange}
					isValid={formData.days.isValid}
					message={VALIDATION_MESSAGES.DAYS_REQUIRED}
					data-cy="input-days"
				/>
			</div>

			<div
				className={`${styles.formControl} ${!formData.areas.isValid ? styles.invalid : ''}`}>
				<h3 className={styles.checkboxLabel}>Cities visited</h3>
				{areas.map((area) => (
					<div
						key={area.id}
						className={styles.checkboxGroup}>
						<Checkbox
							id={area.id}
							label={area.label}
							value={area.id}
							checked={formData.areas.val.includes(area.id)}
							onChange={handleCheckboxChange}
							data-cy={`checkbox-${area.id}`}
						/>
					</div>
				))}
				{!formData.areas.isValid && (
					<p>{VALIDATION_MESSAGES.CITIES_REQUIRED}</p>
				)}
			</div>

			{/* TODO: AddFile component */}

			{!formIsValid && (
				<p className={styles.invalidForm}>
					Please fix the above errors and submit again.
				</p>
			)}

			<div className={styles.actions}>
				<BaseButton
					type="submit"
					data-cy="submit-button">
					Register
				</BaseButton>
			</div>
		</form>
	)
}

export default TravellerRegistrationForm
