import { VALIDATION_MESSAGES } from '@/constants/validation/messages'
import { TRAVELLER_REGISTRATION_AREAS } from '@/constants/travellers/registration'

import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import BaseButton from '@/components/ui/button/BaseButton'

import { useTravellerRegistration } from './hooks/useTravellerRegistration'

import styles from './TravellerRegistrationForm.module.scss'

const TravellerRegistrationForm = () => {
	const {
		formData,
		formIsValid,
		handleInputChange,
		handleCheckboxChange,
		submitHandler,
	} = useTravellerRegistration()

	return (
		<form
			className={styles.form}
			onSubmit={submitHandler}
			data-cy="traveller-registration-form">
			<h2>Register as a Traveller</h2>
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

			<fieldset
				className={`${styles.formControl} ${!formData.areas.isValid ? styles.invalid : ''} ${styles.fieldset}`}>
				<legend className={styles.checkboxLabel}>Cities visited</legend>
				{TRAVELLER_REGISTRATION_AREAS.map((area) => (
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
					<p role="alert">{VALIDATION_MESSAGES.CITIES_REQUIRED}</p>
				)}
			</fieldset>

			{/* TODO: AddFile component */}

			{!formIsValid && (
				<p
					className={styles.invalidForm}
					role="alert">
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
