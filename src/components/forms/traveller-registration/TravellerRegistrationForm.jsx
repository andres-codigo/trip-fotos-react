import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import {
	CITY_SEARCH_STATUS,
	TRIP_PHOTOS_CONFIG,
	TRAVELLER_REGISTRATION_FIELDS,
	TRIP_DATES_CONFIG,
	TRAVELLER_ITEM_CONFIG,
} from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import Combobox from '@/components/ui/form/combobox/Combobox'
import BaseButton from '@/components/ui/button/BaseButton'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'
import ErrorSummary from '@/components/ui/form/error-summary/ErrorSummary'
import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'
import AddFile from '@/components/forms/file-uploader/AddFile'
import TripPhotos from '@/components/forms/trip-photos/TripPhotos'

import { renderVisuallyHiddenError } from '@/utils/form/errorUtils'
import { cn } from '@/utils/cn'
import { formatCity, getCityId } from '@/utils/formatCity'
import { formatTripDays, getTripLength, toIsoDate } from '@/utils/tripDates'
import { toTripPhotos } from '@/utils/tripPhotos'
import {
	helpTextClasses,
	labelClasses,
	requiredMarkClasses,
} from '@/components/ui/form/fieldClasses'
import useTravellerRegistration from './hooks/useTravellerRegistration'
import useCitySearch from '@/components/forms/traveller-registration/hooks/useCitySearch'

const TRIP_DATES_HINT_ID = 'trip-dates-hint'
const PHOTOS_HELP_ID = 'photos-help'
const PHOTOS_ERROR_ID = 'photos-error'

const TravellerRegistrationForm = ({
	isLoading = false,
	onSubmit,
	initialTraveller = null,
	title = 'Register as a traveller',
	submitLabel = 'Register',
	actions = null,
	focusPhotos = false,
}) => {
	const isEditing = Boolean(initialTraveller)
	const photos = useMemo(
		() => toTripPhotos(initialTraveller ?? {}),
		[initialTraveller],
	)
	const [removedUrls, setRemovedUrls] = useState([])
	const [alts, setAlts] = useState(() =>
		Object.fromEntries(photos.map(({ url, alt }) => [url, alt])),
	)
	const [photosError, setPhotosError] = useState('')
	const [summary, setSummary] = useState({ errors: [], focusKey: 0 })
	const photosRef = useRef(null)

	// "Add photos" lands here, so the uploader takes focus once the form is drawn
	useEffect(() => {
		if (!focusPhotos || !photosRef.current) return
		photosRef.current.scrollIntoView?.()
		photosRef.current.querySelector('input[type="file"]')?.focus()
	}, [focusPhotos])

	const {
		formData,
		files,
		handleInputChange,
		handleInputBlur,
		handleCityAdd,
		handleCityRemove,
		handleCitiesBlur,
		handleFilesUpdated: onFilesUpdated,
		submitHandler,
	} = useTravellerRegistration(initialTraveller)

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

	const {
		FIRST_NAME,
		LAST_NAME,
		TRIP_DESCRIPTION,
		TRIP_START,
		TRIP_END,
		CITIES,
		FILES,
	} = TRAVELLER_REGISTRATION_FIELDS

	const fieldConfig = {
		[FIRST_NAME]: {
			label: 'First name',
			testId: 'first-name-input',
			autoComplete: 'given-name',
		},
		[LAST_NAME]: {
			label: 'Last name',
			testId: 'last-name-input',
			autoComplete: 'family-name',
		},
		[TRIP_DESCRIPTION]: {
			label: 'About your trip',
			testId: 'trip-description-input',
		},
		[TRIP_START]: {
			label: TRIP_DATES_CONFIG.START_LABEL,
			testId: 'trip-start-input',
		},
		[TRIP_END]: {
			label: TRIP_DATES_CONFIG.END_LABEL,
			testId: 'trip-end-input',
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
			onBlur: handleInputBlur,
			isValid: fieldState.isValid,
			message: fieldState.message,
			disabled: isLoading,
			required: true,
			showRequiredMark: true,
			autoComplete: config.autoComplete,
			'data-cy': config.testId,
		}
	}

	const today = toIsoDate(new Date())
	const tripDatesValid =
		formData[TRIP_START].isValid && formData[TRIP_END].isValid
	const tripLength =
		tripDatesValid &&
		getTripLength(formData[TRIP_START].value, formData[TRIP_END].value)

	const getDateInputProps = (field) => ({
		...getInputProps(field),
		type: 'date',
		max: today,
		'aria-describedby': formData[field].isValid
			? TRIP_DATES_HINT_ID
			: `${TRIP_DATES_HINT_ID} ${field}-error`,
	})

	const keptPhotos = photos
		.filter(({ url }) => !removedUrls.includes(url))
		.map((photo) => ({ ...photo, alt: alts[photo.url] ?? '' }))
	const removedPhotos = photos.filter(({ url }) => removedUrls.includes(url))

	const handleRemovePhoto = (url) => {
		setRemovedUrls((urls) => [...urls, url])
		setPhotosError('')
	}

	const handleUndoPhoto = (url) =>
		setRemovedUrls((urls) => urls.filter((removed) => removed !== url))

	const hasPhoto = keptPhotos.length + files.length > 0

	const handleValidSubmit = (data) => {
		setPhotosError('')
		setSummary((current) => ({ ...current, errors: [] }))
		onSubmit(isEditing ? { ...data, keptPhotos, removedPhotos } : data)
	}

	// The summary lists what was wrong at the submit, in field order, until the next submit
	const handleInvalidSubmit = (data) => {
		const nextPhotosError = hasPhoto
			? ''
			: VALIDATION_MESSAGES.PHOTOS_REQUIRED
		setPhotosError(nextPhotosError)

		const errors = [
			FIRST_NAME,
			LAST_NAME,
			TRIP_DESCRIPTION,
			TRIP_START,
			TRIP_END,
			CITIES,
		]
			.filter((field) => !data[field].isValid && data[field].message)
			.map((field) => ({ id: field, message: data[field].message }))
		if (nextPhotosError)
			errors.push({ id: FILES, message: nextPhotosError })

		setSummary(({ focusKey }) => ({ errors, focusKey: focusKey + 1 }))
	}

	const handleFilesUpdated = (updatedFiles) => {
		onFilesUpdated(updatedFiles)
		if (updatedFiles.length) setPhotosError('')
	}

	return (
		<form
			onSubmit={submitHandler(handleValidSubmit, {
				isExtraValid: hasPhoto,
				onInvalid: handleInvalidSubmit,
			})}
			noValidate
			data-cy="traveller-registration-form"
			aria-busy={isLoading}
			aria-labelledby="traveller-registration-title">
			<h1
				id="traveller-registration-title"
				className="mt-0 mb-2 text-[1.5rem]"
				data-cy="traveller-registration-form-title">
				{title}
			</h1>
			<RequiredLegend className="mb-4" />
			<ErrorSummary
				errors={summary.errors}
				focusKey={summary.focusKey}
				className="mb-4"
			/>
			<LoadingAnnouncement isLoading={isLoading} />
			<div className="my-2">
				<Input {...getInputProps(FIRST_NAME)} />
				{renderVisuallyHiddenError(
					formData[FIRST_NAME],
					'first-name-error',
					'sr-only',
				)}
			</div>

			<div className="my-2">
				<Input {...getInputProps(LAST_NAME)} />
				{renderVisuallyHiddenError(
					formData[LAST_NAME],
					'last-name-error',
					'sr-only',
				)}
			</div>

			<div className="my-2">
				<Textarea
					rows={5}
					{...getInputProps(TRIP_DESCRIPTION)}
				/>
				{renderVisuallyHiddenError(
					formData[TRIP_DESCRIPTION],
					'trip-description-error',
					'sr-only',
				)}
			</div>

			<fieldset
				className="mx-0 my-2 min-w-0 border-0 p-0"
				data-cy="trip-dates">
				<legend className={labelClasses}>
					{TRIP_DATES_CONFIG.LEGEND}
				</legend>
				<div className="grid grid-cols-2 gap-2.5">
					<Input {...getDateInputProps(TRIP_START)} />
					<Input {...getDateInputProps(TRIP_END)} />
				</div>
				{/* One live region from the start, so the length is announced when it replaces the hint */}
				<p
					id={TRIP_DATES_HINT_ID}
					role="status"
					className={cn(
						'mt-1 mb-0 text-sm',
						tripLength ? 'text-accent-text' : 'text-text-muted',
					)}
					data-cy="trip-length">
					{tripLength
						? formatTripDays(tripLength)
						: TRIP_DATES_CONFIG.HINT}
				</p>
				{renderVisuallyHiddenError(
					formData[TRIP_START],
					'trip-start-error-hidden',
					'sr-only',
				)}
				{renderVisuallyHiddenError(
					formData[TRIP_END],
					'trip-end-error-hidden',
					'sr-only',
				)}
			</fieldset>

			<div className="my-2">
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
						className="mt-2 mb-0 flex list-none flex-wrap gap-2 p-0"
						aria-label={CITY_SEARCH_TEXT.SELECTED_LABEL}
						data-cy="selected-cities">
						{formData[CITIES].value.map((city) => {
							const name = formatCity(city)
							return (
								<li
									key={getCityId(city)}
									className="inline-flex items-center gap-1 rounded-pill bg-surface-accent py-1! pr-1! pl-3! text-accent-text"
									data-cy="selected-city">
									<span>{name}</span>
									<button
										type="button"
										className="size-7 cursor-pointer rounded-full border-0 bg-transparent text-[1.25rem] leading-none text-inherit hover:bg-surface"
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
						<p
							id="cities-error"
							className="mt-1 text-danger-text">
							{formData[CITIES].message}
						</p>
						{renderVisuallyHiddenError(
							formData[CITIES],
							'cities-error-hidden',
							'sr-only',
						)}
					</>
				)}
			</div>

			<fieldset
				ref={photosRef}
				id={TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}
				data-cy="traveller-photos"
				className="mx-0 mt-2 mb-6 flex scroll-mt-24 flex-col gap-4 border-0 p-0">
				<legend className="mb-2 font-bold">
					{TRIP_PHOTOS_CONFIG.LEGEND}{' '}
					<span
						aria-hidden="true"
						className={requiredMarkClasses}>
						*
					</span>
				</legend>
				<p
					id={PHOTOS_HELP_ID}
					className={cn(helpTextClasses, 'mt-0 mb-0')}>
					{TRIP_PHOTOS_CONFIG.HELP}
				</p>
				{photosError && (
					<ErrorMessage
						id={PHOTOS_ERROR_ID}
						className="m-0 text-danger-text"
						data-cy="photos-error">
						{photosError}
					</ErrorMessage>
				)}
				{isEditing && (
					<TripPhotos
						photos={photos}
						removedUrls={removedUrls}
						newCount={files.length}
						alts={alts}
						onRemove={handleRemovePhoto}
						onUndo={handleUndoPhoto}
						onAltChange={(url, alt) =>
							setAlts((current) => ({ ...current, [url]: alt }))
						}
						disabled={isLoading}
					/>
				)}
				{/* A block wrapper, so the uploader's auto margins centre it rather than shrink it to its text */}
				<div>
					<AddFile
						id={FILES}
						onFilesUpdated={handleFilesUpdated}
						isInvalid={Boolean(photosError)}
						describedBy={
							photosError
								? `${PHOTOS_HELP_ID} ${PHOTOS_ERROR_ID}`
								: PHOTOS_HELP_ID
						}
					/>
				</div>
			</fieldset>

			<div
				className={cn(
					'flex flex-wrap gap-2',
					isEditing && 'justify-end',
				)}>
				{actions}
				<BaseButton
					id="register-button"
					type="submit"
					data-cy="register-button"
					isDisabled={isLoading}>
					{submitLabel}
				</BaseButton>
			</div>
		</form>
	)
}

TravellerRegistrationForm.propTypes = {
	isLoading: PropTypes.bool,
	onSubmit: PropTypes.func.isRequired,
	initialTraveller: PropTypes.shape({
		firstName: PropTypes.string,
		lastName: PropTypes.string,
		tripDescription: PropTypes.string,
		tripStart: PropTypes.string,
		tripEnd: PropTypes.string,
		cities: PropTypes.array,
		files: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
		fileDimensions: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object,
		]),
		fileThumbnails: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object,
		]),
		fileAlts: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	}),
	title: PropTypes.string,
	submitLabel: PropTypes.string,
	actions: PropTypes.node,
	focusPhotos: PropTypes.bool,
}

export default TravellerRegistrationForm
