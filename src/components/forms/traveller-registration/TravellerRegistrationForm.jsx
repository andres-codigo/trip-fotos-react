import { VALIDATION_MESSAGES } from '@/constants/validation/messages'
import { TRAVELLER_REGISTRATION_AREAS } from '@/constants/travellers/registration'

import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import BaseButton from '@/components/ui/button/BaseButton'

import { useTravellerRegistration } from './hooks/useTravellerRegistration'

import travellerRegistrationFormStyles from './TravellerRegistrationForm.module.scss'

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
			className={travellerRegistrationFormStyles.form}
			onSubmit={submitHandler}
			data-cy="traveller-registration-form">
			<h2>Register as a Traveller</h2>
			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.firstName.isValid ? travellerRegistrationFormStyles.invalid : ''}`}>
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
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.lastName.isValid ? travellerRegistrationFormStyles.invalid : ''}`}>
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
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.description.isValid ? travellerRegistrationFormStyles.invalid : ''}`}>
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
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.days.isValid ? travellerRegistrationFormStyles.invalid : ''}`}>
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
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.areas.isValid ? travellerRegistrationFormStyles.invalid : ''} ${travellerRegistrationFormStyles.fieldset}`}>
				<legend>Cities visited</legend>
				{TRAVELLER_REGISTRATION_AREAS.map((area) => (
					<div
						key={area.id}
						className={
							travellerRegistrationFormStyles.checkboxGroup
						}>
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
					className={travellerRegistrationFormStyles.invalidForm}
					role="alert">
					Please fix the above errors and submit again.
				</p>
			)}

			<div className={travellerRegistrationFormStyles.actions}>
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
