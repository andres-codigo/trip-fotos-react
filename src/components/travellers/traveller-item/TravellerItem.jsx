import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { handleApiError } from '@/utils/errorHandler'
import { TRAVELLER_ITEM } from '@/constants/test'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { GLOBAL, PATHS } from '@/constants/ui'

import { formatCity, getCityId } from '@/utils/formatCity'

import { selectIsAdmin, selectUserId } from '@/store/slices/authenticationSlice'
import {
	deleteTraveller,
	selectIsTraveller,
} from '@/store/slices/travellersSlice'

import BaseBadge from '@/components/ui/badge/BaseBadge'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import ImageGallery from '@/components/ui/image-gallery/ImageGallery'
import TripSummary from '@/components/travellers/trip-summary/TripSummary'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

const shortenTripDescription = (tripDescription = '') =>
	tripDescription.length >= TRAVELLER_ITEM_CONFIG.TRIP_DESCRIPTION_MAX_LENGTH
		? `${tripDescription.slice(0, TRAVELLER_ITEM_CONFIG.TRIP_DESCRIPTION_MAX_LENGTH)}...`
		: tripDescription

const TravellerItem = ({
	id,
	firstName,
	lastName,
	tripDescription,
	tripStart,
	tripEnd,
	daysInCity,
	cities = [],
	files = [],
	fileDimensions,
	fileThumbnails,
	fileAlts,
}) => {
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState(null)
	const [isConfirming, setIsConfirming] = useState(false)
	const deleteButtonRef = useRef(null)

	const dispatch = useDispatch()
	const userId = useSelector(selectUserId)
	const isAdmin = useSelector(selectIsAdmin)
	const isTraveller = useSelector(selectIsTraveller)

	const fullName = `${firstName} ${lastName}`
	const detailsLink = `${PATHS.TRAVELLERS}/${id}`
	const photosLink = `${detailsLink}#${TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}`
	const contactLink = `${detailsLink}${TRAVELLER_ITEM_CONFIG.CONTACT_PATH_SEGMENT}`
	const editLink = `${detailsLink}${TRAVELLER_ITEM_CONFIG.EDIT_PATH_SEGMENT}`
	const isOwnRecord = id === userId
	const canContact = !isOwnRecord && isTraveller
	const canDelete = isAdmin && !isOwnRecord

	const openConfirm = () => setIsConfirming(true)

	const cancelDelete = () => {
		setIsConfirming(false)
		deleteButtonRef.current?.focus()
	}

	const confirmDelete = async () => {
		setIsConfirming(false)
		setIsDeleting(true)
		const result = await dispatch(
			deleteTraveller({ travellerId: id, files, fileThumbnails }),
		)

		if (deleteTraveller.rejected.match(result)) {
			setError(handleApiError(result.payload))
			setIsDeleting(false)
		}
	}

	const clearError = () => setError(null)

	return (
		<>
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={clearError}
					data-cy={TRAVELLER_ITEM.ERROR_DIALOG}>
					{error}
				</BaseDialog>
			)}
			{isConfirming && (
				<BaseDialog
					show={true}
					title={TRAVELLER_ITEM_CONFIG.DELETE_DIALOG_TITLE}
					onClose={cancelDelete}
					data-cy={TRAVELLER_ITEM.DELETE_DIALOG}
					actions={
						<>
							{/* Cancel takes focus so a stray Enter cannot confirm an irreversible delete */}
							<BaseButton
								type="button"
								modeType="outline"
								autoFocus
								onClick={cancelDelete}
								data-cy={TRAVELLER_ITEM.DELETE_CANCEL}>
								Cancel
							</BaseButton>
							<BaseButton
								type="button"
								modeType="danger"
								onClick={confirmDelete}
								data-cy={TRAVELLER_ITEM.DELETE_CONFIRM}>
								Delete
							</BaseButton>
						</>
					}>
					This permanently removes {fullName}&apos;s profile, photos
					and messages.
				</BaseDialog>
			)}
			{isDeleting ? (
				<li
					className="my-2 list-none"
					data-cy={TRAVELLER_ITEM.SPINNER}>
					<BaseSpinner
						label={GLOBAL.SPINNER_LABEL.DELETING_TRAVELLER}
					/>
				</li>
			) : (
				<li
					className={cn(
						'my-4 list-none rounded-lg border border-border-strong p-4',
						isOwnRecord && 'border-2',
					)}
					data-own={isOwnRecord}
					data-cy={TRAVELLER_ITEM.ROOT}>
					<h3
						className="m-0 text-2xl leading-normal font-normal"
						data-cy={TRAVELLER_ITEM.NAME}>
						{fullName}
					</h3>
					<TripSummary
						tripStart={tripStart}
						tripEnd={tripEnd}
						daysInCity={daysInCity}
						data-cy={TRAVELLER_ITEM.TRIP}
					/>
					<p
						className="italic"
						data-cy={TRAVELLER_ITEM.TRIP_DESCRIPTION}>
						{shortenTripDescription(tripDescription)}
					</p>
					<div
						className="flex flex-wrap gap-2 pt-1 pb-4"
						data-cy={TRAVELLER_ITEM.BADGES}>
						{cities.map((city) => (
							<BaseBadge
								key={getCityId(city)}
								type={getCityId(city)}
								title={formatCity(city)}
							/>
						))}
					</div>
					{files.length > 0 && (
						<ul
							className="m-0 flex list-none flex-wrap gap-x-[2%] gap-y-8 py-4 pl-0 [@media(max-width:480px)]:mb-[0.9375rem] [@media(max-width:480px)]:gap-x-[4%] [@media(max-width:480px)]:gap-y-4 [@media(max-width:480px)]:py-2"
							data-cy={TRAVELLER_ITEM.IMAGES_LIST}>
							<ImageGallery
								title={fullName}
								dimensions={fileDimensions}
								thumbnails={fileThumbnails}
								alts={fileAlts}
								urls={files.slice(
									0,
									TRAVELLER_ITEM_CONFIG.MAX_IMAGES,
								)}
							/>
							{files.length >
								TRAVELLER_ITEM_CONFIG.MAX_IMAGES && (
								<li className="relative w-[32%] overflow-hidden bg-accent font-medium text-on-accent tile-focus-ring [@media(max-width:480px)]:w-[48%]">
									<Link
										className="block h-full"
										to={photosLink}
										data-cy={TRAVELLER_ITEM.SEE_ALL_LINK}>
										<span className="flex h-full items-center justify-center p-5 text-center">
											See all {files.length} photos
										</span>
									</Link>
								</li>
							)}
						</ul>
					)}
					<div className="flex flex-wrap items-center justify-end gap-2">
						{canContact && (
							<BaseButton
								isLink
								to={contactLink}
								modeType="outline"
								data-cy={TRAVELLER_ITEM.MESSAGE}>
								{TRAVELLER_ITEM_CONFIG.MESSAGE_LABEL(firstName)}
							</BaseButton>
						)}
						{isOwnRecord && (
							<BaseButton
								isLink
								to={editLink}
								modeType="outline"
								data-cy={TRAVELLER_ITEM.EDIT}>
								{TRAVELLER_ITEM_CONFIG.EDIT_LABEL}
							</BaseButton>
						)}
						<BaseButton
							isLink
							to={detailsLink}
							modeType="primary"
							data-cy={TRAVELLER_ITEM.VIEW_TRIP}>
							{TRAVELLER_ITEM_CONFIG.VIEW_LABEL}
						</BaseButton>
						{canDelete && (
							<BaseButton
								type="button"
								modeType="danger"
								ref={deleteButtonRef}
								onClick={openConfirm}
								data-cy={TRAVELLER_ITEM.DELETE}>
								Delete
							</BaseButton>
						)}
					</div>
				</li>
			)}
		</>
	)
}

TravellerItem.propTypes = {
	id: PropTypes.string.isRequired,
	firstName: PropTypes.string,
	lastName: PropTypes.string,
	tripDescription: PropTypes.string,
	tripStart: PropTypes.string,
	tripEnd: PropTypes.string,
	daysInCity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	cities: PropTypes.arrayOf(
		PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				id: PropTypes.string,
				city: PropTypes.string,
				region: PropTypes.string,
				country: PropTypes.string,
			}),
		]),
	),
	files: PropTypes.arrayOf(PropTypes.string),
	fileDimensions: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.object),
		PropTypes.object,
	]),
	fileThumbnails: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.array),
		PropTypes.object,
	]),
	fileAlts: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
}

export default TravellerItem
