import PropTypes from 'prop-types'

import { TRAVELLER_REGISTRATION_AREAS } from '@/constants/travellers/registration'
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

	const FIRST_NAME = 'firstName'
	const LAST_NAME = 'lastName'
	const DESCRIPTION = 'description'
	const DAYS = 'days'
	const AREAS = 'areas'

	const fieldConfig = {
		[FIRST_NAME]: { label: 'First name', testId: 'first-name-input' },
		[LAST_NAME]: { label: 'Last name', testId: 'last-name-input' },
		[DESCRIPTION]: { label: 'Description', testId: 'description-input' },
		[DAYS]: { label: 'Days', testId: 'days-input' },
		[AREAS]: { label: 'Areas', testId: 'areas-input' },
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
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.firstName.isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Input {...getInputProps('firstName')} />
				{renderVisuallyHiddenError(
					formData.firstName,
					'first-name-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.lastName.isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Input {...getInputProps('lastName')} />
				{renderVisuallyHiddenError(
					formData.lastName,
					'last-name-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.description.isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Textarea
					rows={5}
					{...getInputProps('description')}
				/>
				{renderVisuallyHiddenError(
					formData.description,
					'description-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.days.isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Input
					type="number"
					{...getInputProps('days')}
				/>
				{renderVisuallyHiddenError(
					formData.days,
					'days-error',
					travellerRegistrationFormStyles.visuallyHidden,
				)}
			</div>

			<fieldset
				className={`${travellerRegistrationFormStyles.formControl} ${!formData.areas.isValid ? travellerRegistrationFormStyles.invalidForm : ''} ${travellerRegistrationFormStyles.fieldset}`}>
				<legend>
					Cities visited{' '}
					<span
						className={
							travellerRegistrationFormStyles.checkboxRequired
						}>
						*
					</span>
				</legend>
				{TRAVELLER_REGISTRATION_AREAS.map((area) => (
					<div
						key={area.id}
						className={
							travellerRegistrationFormStyles.checkboxGroup
						}>
						<Checkbox
							{...getInputProps(AREAS)}
							id={area.id}
							label={area.label}
							value={area.id}
							checked={formData.areas.value.includes(area.id)}
							onChange={handleCheckboxChange}
							isArrayItem={true}
							showRequiredMark={false}
							data-cy={`checkbox-${area.id}`}
						/>
					</div>
				))}
				{!formData.areas.isValid && formData.areas.message && (
					<>
						<p
							id="areas-error"
							role="alert">
							{formData.areas.message}
						</p>
						{renderVisuallyHiddenError(
							formData.areas,
							'areas-error-hidden',
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
