import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler'
import { toTripPhotos } from '@/utils/tripPhotos'
import { cn } from '@/utils/cn'
import { EDIT_TRIP, TRAVELLER_DETAIL } from '@/constants/test'
import {
	EDIT_TRIP_CONFIG,
	TRAVELLER_DETAIL_CONFIG,
	TRAVELLER_ITEM_CONFIG,
} from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT, PATHS } from '@/constants/ui'

import { selectUserId } from '@/store/slices/authenticationSlice'
import {
	deleteTraveller,
	loadTraveller,
	selectSelectedTraveller,
	selectUploadProgress,
	updateTraveller,
} from '@/store/slices/travellersSlice'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseProgress from '@/components/ui/progress/BaseProgress'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

const EditTrip = () => {
	const { id } = useParams()
	const { hash } = useLocation()
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const userId = useSelector(selectUserId)
	// userId is persisted, so judging before rehydration would bounce the owner on a hard reload
	const isRehydrated = useSelector(
		(state) => state._persist?.rehydrated ?? true,
	)
	const selectedTraveller = useSelector(selectSelectedTraveller)
	const uploadProgress = useSelector(selectUploadProgress)

	const [outcome, setOutcome] = useState({ id: null, failed: false })
	const [isSaving, setIsSaving] = useState(false)
	const [isConfirming, setIsConfirming] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState(null)
	const [deleteError, setDeleteError] = useState(null)
	const deleteButtonRef = useRef(null)

	const isOwnRecord = Boolean(userId) && id === userId

	useEffect(() => {
		if (!isOwnRecord) {
			return undefined
		}

		let isCurrent = true

		dispatch(loadTraveller(id)).then((result) => {
			if (isCurrent) {
				setOutcome({
					id,
					failed: loadTraveller.rejected.match(result),
				})
			}
		})

		return () => {
			isCurrent = false
		}
	}, [dispatch, id, isOwnRecord])

	// Focused before the error dialog's focus trap mounts, so closing the dialog returns focus to it
	useLayoutEffect(() => {
		if (deleteError) {
			deleteButtonRef.current?.focus()
		}
	}, [deleteError])

	const detailPath = `${PATHS.TRAVELLERS}/${id}`
	const isLoading = outcome.id !== id
	const traveller =
		!outcome.failed && selectedTraveller?.id === id
			? selectedTraveller
			: null
	const photoCount = traveller ? toTripPhotos(traveller).length : 0

	const handleSubmit = async (data) => {
		setIsSaving(true)
		setError(null)

		try {
			await dispatch(updateTraveller(data)).unwrap()

			navigate(detailPath, {
				state: { alertMessage: EDIT_TRIP_CONFIG.SAVED_MESSAGE },
			})
		} catch (error) {
			setError(handleApiError(error, ERROR_MESSAGES.FAILED_TO_SAVE_TRIP))
			setIsSaving(false)
		}
	}

	const openConfirm = () => setIsConfirming(true)

	const cancelDelete = () => {
		setIsConfirming(false)
		deleteButtonRef.current?.focus()
	}

	const confirmDelete = async () => {
		setIsConfirming(false)
		setIsDeleting(true)
		const result = await dispatch(
			deleteTraveller({
				travellerId: id,
				files: traveller.files,
				fileThumbnails: traveller.fileThumbnails,
			}),
		)

		if (deleteTraveller.rejected.match(result)) {
			setIsDeleting(false)
			// The thunk's message is about the request; the traveller needs to hear what did not happen
			setDeleteError(ERROR_MESSAGES.FAILED_TO_DELETE_PROFILE)
			return
		}

		navigate(PATHS.TRAVELLERS, {
			replace: true,
			state: { alertMessage: EDIT_TRIP_CONFIG.DELETED_MESSAGE },
		})
	}

	const closeError = () => setError(null)

	const closeDeleteError = () => {
		setDeleteError(null)
		deleteButtonRef.current?.focus()
	}

	if (!isRehydrated || !userId) {
		return null
	}

	if (!isOwnRecord) {
		return (
			<Navigate
				to={detailPath}
				replace
			/>
		)
	}

	const heading = (
		<h1
			className={cn(
				'm-0 text-[1.5rem] font-normal',
				isLoading && 'sr-only',
			)}>
			{EDIT_TRIP_CONFIG.TITLE}
		</h1>
	)

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-left"
			data-cy={EDIT_TRIP.ROOT}>
			<title>{`${EDIT_TRIP_CONFIG.TITLE} · ${GLOBAL.SITE_NAME}`}</title>
			{(error || deleteError) && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={error ? closeError : closeDeleteError}
					data-cy={EDIT_TRIP.ERROR_DIALOG}>
					{error || deleteError}
				</BaseDialog>
			)}
			{isSaving && (
				<BaseDialog
					show={true}
					title={EDIT_TRIP_CONFIG.SAVING_TITLE}
					fixed
					data-cy={EDIT_TRIP.SAVING_DIALOG}>
					{uploadProgress ? (
						<div className="flex flex-col gap-4">
							<span>{EDIT_TRIP_CONFIG.SAVING_MESSAGE}</span>
							<BaseProgress
								value={uploadProgress.percent}
								label={GLOBAL.UPLOAD_PROGRESS_LABEL(
									uploadProgress.uploadedFiles,
									uploadProgress.totalFiles,
									uploadProgress.percent,
								)}
							/>
						</div>
					) : (
						<>
							{EDIT_TRIP_CONFIG.SAVING_MESSAGE}
							<BaseSpinner />
						</>
					)}
				</BaseDialog>
			)}
			{isConfirming && (
				<BaseDialog
					show={true}
					title={EDIT_TRIP_CONFIG.DELETE_DIALOG_TITLE}
					onClose={cancelDelete}
					data-cy={EDIT_TRIP.DELETE_DIALOG}
					actions={
						<>
							{/* Cancel takes focus so a stray Enter cannot confirm an irreversible delete */}
							<BaseButton
								type="button"
								modeType="outline"
								autoFocus
								onClick={cancelDelete}
								data-cy={EDIT_TRIP.DELETE_CANCEL}>
								Cancel
							</BaseButton>
							<BaseButton
								type="button"
								modeType="danger"
								onClick={confirmDelete}
								data-cy={EDIT_TRIP.DELETE_CONFIRM}>
								Delete
							</BaseButton>
						</>
					}>
					{EDIT_TRIP_CONFIG.DELETE_DIALOG_MESSAGE(photoCount)}
				</BaseDialog>
			)}
			{isLoading && (
				<>
					{heading}
					<div
						className="my-2"
						data-cy={TRAVELLER_DETAIL.SPINNER}>
						<BaseSpinner label={GLOBAL.SPINNER_LABEL.TRAVELLER} />
					</div>
				</>
			)}
			{/* The record is gone from the store once deleted, which must not flash the not-found card before the redirect */}
			{!isLoading && !traveller && !isDeleting && (
				<BaseCard>
					{heading}
					<div data-cy={TRAVELLER_DETAIL.NOT_FOUND}>
						<ErrorMessage>
							{TRAVELLER_DETAIL_CONFIG.NOT_FOUND_MESSAGE}
						</ErrorMessage>
						<BaseButton
							isLink
							to={PATHS.TRAVELLERS}
							modeType="outline"
							data-cy={TRAVELLER_DETAIL.BACK_TO_TRAVELLERS}>
							{TRAVELLER_DETAIL_CONFIG.BACK_LABEL}
						</BaseButton>
					</div>
				</BaseCard>
			)}
			{isDeleting && (
				<div
					className="my-2"
					data-cy={EDIT_TRIP.DELETING}>
					<BaseSpinner label={EDIT_TRIP_CONFIG.DELETING_MESSAGE} />
				</div>
			)}
			{!isLoading && traveller && (
				// Hidden rather than unmounted while deleting, so a failed delete keeps any unsaved edits
				<div
					hidden={isDeleting}
					className={PAGE_LAYOUT.WIDE}
					data-cy={EDIT_TRIP.LAYOUT}>
					<TravellerRegistrationForm
						key={traveller.id}
						isLoading={isSaving}
						onSubmit={handleSubmit}
						initialTraveller={traveller}
						title={EDIT_TRIP_CONFIG.TITLE}
						submitLabel={EDIT_TRIP_CONFIG.SAVE_LABEL}
						focusPhotos={
							hash === `#${TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}`
						}
						backLink={
							<BaseButton
								isLink
								to={detailPath}
								ariaLabel={EDIT_TRIP_CONFIG.BACK_LABEL}
								className="inline-flex min-h-11 items-center gap-1 text-sm text-text-link underline underline-offset-4"
								data-cy={EDIT_TRIP.BACK_TO_TRIP}>
								<svg
									aria-hidden="true"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<path d="m15 18-6-6 6-6" />
								</svg>
								{EDIT_TRIP_CONFIG.BACK_LABEL}
							</BaseButton>
						}
						actions={
							<BaseButton
								isLink
								to={detailPath}
								modeType="outline"
								data-cy={EDIT_TRIP.CANCEL}>
								{EDIT_TRIP_CONFIG.CANCEL_LABEL}
							</BaseButton>
						}
					/>
					{/* After Save and away from it: under the trip details from 1024px */}
					<BaseCard
						className={cn('mt-8 lg:mt-6', PAGE_LAYOUT.LEFT_COLUMN)}>
						<section data-cy={EDIT_TRIP.DELETE_SECTION}>
							<h2>{EDIT_TRIP_CONFIG.DELETE_HEADING}</h2>
							<p>{EDIT_TRIP_CONFIG.DELETE_SUMMARY(photoCount)}</p>
							<div className="flex">
								<BaseButton
									type="button"
									modeType="dangerOutline"
									ref={deleteButtonRef}
									onClick={openConfirm}
									data-cy={EDIT_TRIP.DELETE}>
									{EDIT_TRIP_CONFIG.DELETE_LABEL}
								</BaseButton>
							</div>
						</section>
					</BaseCard>
				</div>
			)}
		</main>
	)
}

export default EditTrip
