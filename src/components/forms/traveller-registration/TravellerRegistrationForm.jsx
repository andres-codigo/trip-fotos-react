import PropTypes from 'prop-types'

import {
	TRAVELLER_REGISTRATION_CITIES,
	TRAVELLER_REGISTRATION_FIELDS,
} from '@/constants/travellers/registration'
import { ACCESSIBILITY } from '@/constants/ui'

import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import BaseButton from '@/components/ui/button/BaseButton'

import { renderVisuallyHiddenError } from '@/utils/form/errorUtils'
import { useTravellerRegistration } from './hooks/useTravellerRegistration'

import travellerRegistrationFormStyles from './TravellerRegistrationForm.module.scss'

const TravellerRegistrationForm = ({ isLoading = false, onSubmit }) => {
	const { formData, handleInputChange, handleCheckboxChange, submitHandler } =
		useTravellerRegistration()

	const { FIRST_NAME, LAST_NAME, DESCRIPTION, DAYS, CITIES } =
		TRAVELLER_REGISTRATION_FIELDS

	const fieldConfig = {
		[FIRST_NAME]: { label: 'First name', testId: 'first-name-input' },
		[LAST_NAME]: { label: 'Last name', testId: 'last-name-input' },
		[DESCRIPTION]: { label: 'Description', testId: 'description-input' },
		[DAYS]: {
			label: 'Days spent in city',
			testId: 'days-spent-in-city-input',
		},
		[CITIES]: { label: 'Cities', testId: 'cities-input' },
	}

	const getInputProps = (field) => {
		const config = fieldConfig[field]
		const fieldState = formData[field]

		if (!config || !fieldState) return {}

		return {
			id: field,
			label: config.label,
			value: fieldState.value,
			onChange: handleInputChange,
			onBlur: handleInputChange,
			isValid: fieldState.isValid,
			message: fieldState.message,
			disabled: isLoading,
			required: true,
			showRequiredMark: true,
			className: 'formControlInput',
			'data-cy': config.testId,
		}
	}

	return (
		<form
			className={travellerRegistrationFormStyles.travellerRegistration}
			onSubmit={submitHandler(onSubmit)}
			noValidate
			data-cy="traveller-registration-form"
			aria-busy={isLoading}
			aria-labelledby="traveller-registration-title">
			<h2
				id="traveller-registration-title"
				className={
					travellerRegistrationFormStyles.travellerRegistrationTitle
				}
				data-cy="traveller-registration-form-title">
				Register as a Traveller
			</h2>
			<div
				aria-live="polite"
				style={ACCESSIBILITY.ARIA_LIVE.POLITE.STYLE}>
				{isLoading ? ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE : ''}
			</div>
			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData[FIRST_NAME].isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Input {...getInputProps(FIRST_NAME)} />
				{renderVisuallyHiddenError(
					formData[FIRST_NAME],
					'first-name-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData[LAST_NAME].isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Input {...getInputProps(LAST_NAME)} />
				{renderVisuallyHiddenError(
					formData[LAST_NAME],
					'last-name-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData[DESCRIPTION].isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Textarea
					rows={5}
					{...getInputProps(DESCRIPTION)}
				/>
				{renderVisuallyHiddenError(
					formData[DESCRIPTION],
					'description-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData[DAYS].isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Input
					type="number"
					{...getInputProps(DAYS)}
				/>
				{renderVisuallyHiddenError(
					formData[DAYS],
					'days-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<fieldset
				className={`${travellerRegistrationFormStyles.formControl} ${!formData[CITIES].isValid ? travellerRegistrationFormStyles.invalidForm : ''} ${travellerRegistrationFormStyles.fieldset}`}>
				<legend>
					Cities visited{' '}
					<span
						className={
							travellerRegistrationFormStyles.checkboxRequired
						}>
						*
					</span>
				</legend>
				{TRAVELLER_REGISTRATION_CITIES.map((city) => (
					<div
						key={city.id}
						className={
							travellerRegistrationFormStyles.checkboxGroup
						}>
						<Checkbox
							{...getInputProps(CITIES)}
							id={city.id}
							label={city.label}
							value={city.id}
							checked={formData[CITIES].value.includes(city.id)}
							onChange={handleCheckboxChange}
							isArrayItem={true}
							showRequiredMark={false}
							data-cy={`checkbox-${city.id}`}
						/>
					</div>
				))}
				{!formData[CITIES].isValid && formData[CITIES].message && (
					<>
						<p
							id="cities-error"
							role="alert">
							{formData[CITIES].message}
						</p>
						{renderVisuallyHiddenError(
							formData[CITIES],
							'cities-error-hidden',
							travellerRegistrationFormStyles.visuallyHidden,
						)}
					</>
				)}
			</fieldset>

			{/* TODO: AddFile component */}

			<div className={travellerRegistrationFormStyles.actions}>
				<BaseButton
					id="register-button"
					type="submit"
					mode="flat"
					data-cy="register-button"
					isDisabled={isLoading}>
					Register
				</BaseButton>
			</div>
		</form>
	)
}

TravellerRegistrationForm.propTypes = {
	isLoading: PropTypes.bool,
	onSubmit: PropTypes.func.isRequired,
}

export default TravellerRegistrationForm
