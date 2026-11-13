import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { cn } from '@/utils/cn'

import { TRAVELLER_DETAIL } from '@/constants/test'
import {
	TRAVELLER_DETAIL_CONFIG,
	TRAVELLER_ITEM_CONFIG,
} from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT, PATHS } from '@/constants/ui'

import { formatCity, getCityId } from '@/utils/formatCity'

import { selectUserId } from '@/store/slices/authenticationSlice'
import {
	loadTraveller,
	selectIsTraveller,
	selectSelectedTraveller,
} from '@/store/slices/travellersSlice'

import Alerts from '@/components/ui/alerts/Alerts'
import BaseBadge from '@/components/ui/badge/BaseBadge'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import ImageGallery from '@/components/ui/image-gallery/ImageGallery'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'
import TripSummary from '@/components/travellers/trip-summary/TripSummary'
import YouTag from '@/components/travellers/you-tag/YouTag'

import useScrollToAnchor from '@/pages/traveller-detail/hooks/useScrollToAnchor'

// The record's own cards get a heavier border
const OWN = 'border-2 border-border-strong'
// Three tiles across, two on narrow screens and four once the photo column is at its widest
const IMAGES_LIST =
	'flex list-none flex-wrap gap-x-[2%] gap-y-8 px-0 py-4 xl:[&>li]:w-[23.5%] [@media(width<=480px)]:gap-x-[4%] [@media(width<=480px)]:gap-y-4 [@media(width<=480px)]:py-2'

const TravellerDetail = () => {
	const { id } = useParams()
	const { hash, state: locationState } = useLocation()
	const dispatch = useDispatch()
	const userId = useSelector(selectUserId)
	const isTraveller = useSelector(selectIsTraveller)
	const selectedTraveller = useSelector(selectSelectedTraveller)

	const [outcome, setOutcome] = useState({ id: null, failed: false })
	const [alertMessage, setAlertMessage] = useState(
		() => locationState?.alertMessage ?? null,
	)

	// Cleared from history so a refresh does not repeat the alert
	useEffect(() => {
		if (alertMessage) {
			window.history.replaceState({}, document.title)
		}
	}, [alertMessage])

	useEffect(() => {
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
	}, [dispatch, id])

	const isLoading = outcome.id !== id
	const hasError = outcome.failed
	const traveller =
		selectedTraveller?.id === id && !hasError ? selectedTraveller : null
	const showProfile = !isLoading && traveller
	const fullName = showProfile
		? `${traveller.firstName} ${traveller.lastName}`
		: TRAVELLER_DETAIL_CONFIG.FALLBACK_TITLE
	const isOwnRecord = id === userId
	const canContact = !isOwnRecord && isTraveller
	const cities = traveller?.cities ?? []
	const files = traveller?.files ?? []
	const editLink = `${PATHS.TRAVELLERS}/${id}${TRAVELLER_ITEM_CONFIG.EDIT_PATH_SEGMENT}`
	const addPhotosLink = `${editLink}#${TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}`

	const shouldScrollToPhotos =
		showProfile && hash === `#${TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}`

	// The photos render after the fetch, so the browser's own hash scrolling has nothing to land on
	const { ref: photosRef } = useScrollToAnchor({
		isActive: shouldScrollToPhotos,
	})

	const name = (
		<h1
			className={cn(
				'm-0 text-[1.5rem] font-normal',
				// Hidden rather than removed while loading, so the page still has its <h1> without a placeholder flashing above the spinner
				isLoading && 'sr-only',
			)}
			data-cy={TRAVELLER_DETAIL.NAME}>
			{fullName}
		</h1>
	)
	// Your own trip carries the same "You" tag as its Travellers card, wrapping under a long name
	const heading =
		showProfile && isOwnRecord ? (
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				{name}
				<YouTag />
			</div>
		) : (
			name
		)

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-left"
			data-cy={TRAVELLER_DETAIL.ROOT}>
			<title>{`${fullName} · ${GLOBAL.SITE_NAME}`}</title>
			{/* Not found stays in one column; loading takes the profile's width, so the spinner sits where the name will be */}
			<div
				className={
					isLoading || showProfile
						? PAGE_LAYOUT.WIDE
						: PAGE_LAYOUT.NARROW
				}
				data-cy={TRAVELLER_DETAIL.LAYOUT}>
				{isLoading && heading}
				{isLoading && (
					<div
						className="my-2"
						data-cy={TRAVELLER_DETAIL.SPINNER}>
						{/* Where the name will be: the left column, at the card's padding and border */}
						<BaseSpinner
							label={GLOBAL.SPINNER_LABEL.TRAVELLER}
							className="justify-start px-[1.0625rem] lg:max-w-[23.75rem]"
						/>
					</div>
				)}
				{!isLoading && (
					<div className="mb-2">
						<BaseButton
							isLink
							to={PATHS.TRAVELLERS}
							ariaLabel={TRAVELLER_DETAIL_CONFIG.BACK_LABEL}
							className="inline-flex min-h-11 items-center gap-1 text-text-link underline underline-offset-4"
							data-cy={TRAVELLER_DETAIL.BACK_TO_TRAVELLERS}>
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
							{TRAVELLER_DETAIL_CONFIG.BACK_LABEL}
						</BaseButton>
					</div>
				)}
				{!isLoading && !showProfile && (
					<BaseCard>
						{heading}
						<div data-cy={TRAVELLER_DETAIL.NOT_FOUND}>
							<ErrorMessage>
								{TRAVELLER_DETAIL_CONFIG.NOT_FOUND_MESSAGE}
							</ErrorMessage>
						</div>
					</BaseCard>
				)}
				{showProfile && (
					<div
						className={cn(PAGE_LAYOUT.COLUMNS, 'gap-8')}
						data-cy={TRAVELLER_DETAIL.COLUMNS}>
						<BaseCard
							className={cn(
								PAGE_LAYOUT.COLUMN_CARD,
								isOwnRecord && OWN,
							)}>
							{alertMessage && (
								<div
									className="mb-4"
									data-cy={TRAVELLER_DETAIL.SAVED_ALERT}>
									<Alerts
										message={alertMessage}
										onClose={() => setAlertMessage(null)}
									/>
								</div>
							)}
							{heading}
							<section data-cy={TRAVELLER_DETAIL.PROFILE}>
								<TripSummary
									tripStart={traveller.tripStart}
									tripEnd={traveller.tripEnd}
									daysInCity={traveller.daysInCity}
									data-cy={TRAVELLER_DETAIL.TRIP}
								/>
								<p
									className="whitespace-pre-line italic"
									data-cy={TRAVELLER_DETAIL.TRIP_DESCRIPTION}>
									{traveller.tripDescription}
								</p>
								<div
									className="flex flex-wrap gap-2 pt-1 pb-4"
									data-cy={TRAVELLER_DETAIL.BADGES}>
									{cities.map((city) => (
										<BaseBadge
											key={getCityId(city)}
											type={getCityId(city)}
											title={formatCity(city)}
										/>
									))}
								</div>
								{canContact && (
									<div className="flex flex-wrap gap-2">
										<BaseButton
											isLink
											to={`${PATHS.TRAVELLERS}/${id}${TRAVELLER_ITEM_CONFIG.CONTACT_PATH_SEGMENT}`}
											modeType="primary"
											data-cy={TRAVELLER_DETAIL.MESSAGE}>
											{TRAVELLER_ITEM_CONFIG.MESSAGE_LABEL(
												traveller.firstName,
											)}
										</BaseButton>
									</div>
								)}
								{isOwnRecord && (
									<div className="flex flex-wrap gap-2">
										<BaseButton
											isLink
											to={editLink}
											modeType="outline"
											data-cy={TRAVELLER_DETAIL.EDIT}>
											{TRAVELLER_ITEM_CONFIG.EDIT_LABEL}
										</BaseButton>
										<BaseButton
											isLink
											to={addPhotosLink}
											modeType="outline"
											data-cy={
												TRAVELLER_DETAIL.ADD_PHOTOS
											}>
											{
												TRAVELLER_DETAIL_CONFIG.ADD_PHOTOS_LABEL
											}
										</BaseButton>
									</div>
								)}
							</section>
						</BaseCard>
						{isOwnRecord && files.length === 0 && (
							<BaseCard
								className={cn(PAGE_LAYOUT.COLUMN_CARD, OWN)}>
								<section data-cy={TRAVELLER_DETAIL.NO_PHOTOS}>
									<h2 className="mt-0">
										{TRAVELLER_DETAIL_CONFIG.PHOTOS_HEADING}
									</h2>
									<p className="text-text-muted">
										{
											TRAVELLER_DETAIL_CONFIG.NO_PHOTOS_MESSAGE
										}
									</p>
									<BaseButton
										isLink
										to={addPhotosLink}
										modeType="primary">
										{
											TRAVELLER_DETAIL_CONFIG.ADD_PHOTOS_LABEL
										}
									</BaseButton>
								</section>
							</BaseCard>
						)}
						{files.length > 0 && (
							<BaseCard
								className={cn(
									PAGE_LAYOUT.COLUMN_CARD,
									isOwnRecord && OWN,
								)}>
								{/* The anchor holds the heading too, so a scroll to the photos shows it under the header */}
								<div
									id={TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}
									ref={photosRef}
									className="scroll-mt-24">
									<div className="flex flex-wrap items-baseline justify-between gap-2">
										<h2
											className="m-0"
											data-cy={
												TRAVELLER_DETAIL.PHOTOS_HEADING
											}>
											{
												TRAVELLER_DETAIL_CONFIG.PHOTOS_HEADING
											}
										</h2>
										<span className="text-sm text-text-muted">
											{TRAVELLER_DETAIL_CONFIG.PHOTO_COUNT(
												files.length,
											)}
										</span>
									</div>
									<ul
										className={IMAGES_LIST}
										data-cy={TRAVELLER_DETAIL.IMAGES_LIST}>
										<ImageGallery
											title={fullName}
											urls={files}
											dimensions={
												traveller?.fileDimensions
											}
											thumbnails={
												traveller?.fileThumbnails
											}
											alts={traveller?.fileAlts}
											urlParam={
												TRAVELLER_DETAIL_CONFIG.PHOTO_PARAM
											}
										/>
									</ul>
								</div>
							</BaseCard>
						)}
					</div>
				)}
			</div>
		</main>
	)
}

export default TravellerDetail
