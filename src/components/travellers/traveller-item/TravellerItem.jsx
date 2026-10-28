import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import PropTypes from 'prop-types'

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
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import travellerItemStyles from './TravellerItem.module.scss'

const formatRegistered = (registered) =>
	registered
		? new Date(registered).toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			})
		: ''

const shortenTripDescription = (tripDescription = '') =>
	tripDescription.length >= TRAVELLER_ITEM_CONFIG.TRIP_DESCRIPTION_MAX_LENGTH
		? `${tripDescription.slice(0, TRAVELLER_ITEM_CONFIG.TRIP_DESCRIPTION_MAX_LENGTH)}...`
		: tripDescription

const TravellerItem = ({
	id,
	firstName,
	lastName,
	tripDescription,
	daysInCity,
	cities = [],
	files = [],
	fileDimensions,
	registered,
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
			deleteTraveller({ travellerId: id, files }),
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
					className={travellerItemStyles.spinnerContainer}
					data-cy={TRAVELLER_ITEM.SPINNER}>
					<BaseSpinner />
				</li>
			) : (
				<li
					className={classNames(travellerItemStyles.traveller, {
						[travellerItemStyles.own]: isOwnRecord,
					})}
					data-cy={TRAVELLER_ITEM.ROOT}>
					<h3
						className={travellerItemStyles.name}
						data-cy={TRAVELLER_ITEM.NAME}>
						{fullName}
					</h3>
					<span
						className={travellerItemStyles.registered}
						data-cy={TRAVELLER_ITEM.REGISTERED}>
						{formatRegistered(registered)}
					</span>
					<p
						className={travellerItemStyles.tripDescription}
						data-cy={TRAVELLER_ITEM.TRIP_DESCRIPTION}>
						{shortenTripDescription(tripDescription)}
					</p>
					<p data-cy={TRAVELLER_ITEM.DAYS}>
						<strong>Days in city:</strong> {daysInCity} days
					</p>
					<div
						className={travellerItemStyles.badges}
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
							className={travellerItemStyles.imagesList}
							data-cy={TRAVELLER_ITEM.IMAGES_LIST}>
							<ImageGallery
								title={fullName}
								dimensions={fileDimensions}
								urls={files.slice(
									0,
									TRAVELLER_ITEM_CONFIG.MAX_IMAGES,
								)}
							/>
							{files.length >
								TRAVELLER_ITEM_CONFIG.MAX_IMAGES && (
								<li
									className={
										travellerItemStyles.imageCounter
									}>
									<Link
										to={photosLink}
										data-cy={TRAVELLER_ITEM.SEE_ALL_LINK}>
										<span>
											See all {files.length} photos
										</span>
									</Link>
								</li>
							)}
						</ul>
					)}
					<div className={travellerItemStyles.actions}>
						{canContact && (
							<BaseButton
								isLink
								to={contactLink}
								modeType="outline"
								data-cy={TRAVELLER_ITEM.CONTACT}>
								Contact
							</BaseButton>
						)}
						<BaseButton
							isLink
							to={detailsLink}
							modeType="primary"
							data-cy={TRAVELLER_ITEM.DETAILS}>
							Details
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
	registered: PropTypes.string,
}

export default TravellerItem
