import { useState } from 'react'
import PropTypes from 'prop-types'

import { TRAVELLER_REGISTRATION_FIELDS } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'

import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import Combobox from '@/components/ui/form/combobox/Combobox'
import BaseButton from '@/components/ui/button/BaseButton'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'
import AddFile from '@/components/forms/file-uploader/AddFile'

import { renderVisuallyHiddenError } from '@/utils/form/errorUtils'
import { formatCity, getCityId } from '@/utils/formatCity'
import useTravellerRegistration from './hooks/useTravellerRegistration'
import useCitySearch, {
	CITY_SEARCH_STATUS,
} from '@/components/forms/traveller-registration/hooks/useCitySearch'

import travellerRegistrationFormStyles from './TravellerRegistrationForm.module.scss'

const TravellerRegistrationForm = ({ isLoading = false, onSubmit }) => {
	const {
		formData,
		handleInputChange,
		handleCityAdd,
		handleCityRemove,
		handleCitiesBlur,
		handleFilesUpdated,
		submitHandler,
	} = useTravellerRegistration()

	// City search uses the Photon geocoder with OpenStreetMap data (ODbL); the required credit is on the privacy page
	const [cityQuery, setCityQuery] = useState('')
	const { results: cityResults, status: citySearchStatus } =
		useCitySearch(cityQuery)
	const { CITY_SEARCH_TEXT } = GLOBAL

	const citySearchMessage = {
		[CITY_SEARCH_STATUS.IDLE]: '',
		[CITY_SEARCH_STATUS.LOADING]: CITY_SEARCH_TEXT.LOADING,
		[CITY_SEARCH_STATUS.ERROR]: CITY_SEARCH_TEXT.ERROR,
		[CITY_SEARCH_STATUS.SUCCESS]: cityResults.length
			? CITY_SEARCH_TEXT.RESULTS(cityResults.length)
			: CITY_SEARCH_TEXT.NO_RESULTS,
	}[citySearchStatus]

	const cityOptions = cityResults.map((city) => ({
		id: city.id,
		label: formatCity(city, { withRegion: true }),
		city,
	}))

	const { FIRST_NAME, LAST_NAME, DESCRIPTION, DAYS, CITIES, FILES } =
		TRAVELLER_REGISTRATION_FIELDS

	const fieldConfig = {
		[FIRST_NAME]: { label: 'First name', testId: 'first-name-input' },
		[LAST_NAME]: { label: 'Last name', testId: 'last-name-input' },
		[DESCRIPTION]: {
			label: 'About your trip',
			testId: 'description-input',
		},
		[DAYS]: {
			label: 'Days spent in city',
			testId: 'days-spent-in-city-input',
		},
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
			<h1
				id="traveller-registration-title"
				className={
					travellerRegistrationFormStyles.travellerRegistrationTitle
				}
				data-cy="traveller-registration-form-title">
				Register as a Traveller
			</h1>
			<LoadingAnnouncement isLoading={isLoading} />
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

			<div
				className={`${travellerRegistrationFormStyles.formControl} ${!formData[CITIES].isValid ? travellerRegistrationFormStyles.invalidForm : ''}`}>
				<Combobox
					id={CITIES}
					label={CITY_SEARCH_TEXT.LABEL}
					placeholder={CITY_SEARCH_TEXT.PLACEHOLDER}
					value={cityQuery}
					onChange={setCityQuery}
					options={cityOptions}
					onSelect={(option) => handleCityAdd(option.city)}
					onBlur={handleCitiesBlur}
					statusMessage={citySearchMessage}
					isValid={formData[CITIES].isValid}
					describedBy={
						formData[CITIES].isValid ? undefined : 'cities-error'
					}
					disabled={isLoading}
					required
				/>
				{formData[CITIES].value.length > 0 && (
					<ul
						className={
							travellerRegistrationFormStyles.selectedCities
						}
						aria-label={CITY_SEARCH_TEXT.SELECTED_LABEL}
						data-cy="selected-cities">
						{formData[CITIES].value.map((city) => {
							const name = formatCity(city)
							return (
								<li
									key={getCityId(city)}
									data-cy="selected-city">
									<span>{name}</span>
									<button
										type="button"
										aria-label={GLOBAL.REMOVE_CITY_LABEL(
											name,
										)}
										onClick={() =>
											handleCityRemove(getCityId(city))
										}
										disabled={isLoading}
										data-cy="selected-city-remove">
										<span aria-hidden="true">&times;</span>
									</button>
								</li>
							)
						})}
					</ul>
				)}
				{!formData[CITIES].isValid && formData[CITIES].message && (
					<>
						<p id="cities-error">{formData[CITIES].message}</p>
						{renderVisuallyHiddenError(
							formData[CITIES],
							'cities-error-hidden',
							travellerRegistrationFormStyles.visuallyHidden,
						)}
					</>
				)}
			</div>

			<fieldset
				className={`${travellerRegistrationFormStyles.formControl} ${travellerRegistrationFormStyles.fieldset}`}>
				<legend>Photos (optional)</legend>
				<AddFile
					id={FILES}
					onFilesUpdated={handleFilesUpdated}
				/>
			</fieldset>

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
