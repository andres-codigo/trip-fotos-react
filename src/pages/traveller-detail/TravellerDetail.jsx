import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { cn } from '@/utils/cn'

import { TRAVELLER_DETAIL } from '@/constants/test'
import {
	TRAVELLER_DETAIL_CONFIG,
	TRAVELLER_ITEM_CONFIG,
} from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import { formatCity, getCityId } from '@/utils/formatCity'

import { selectUserId } from '@/store/slices/authenticationSlice'
import {
	loadTraveller,
	selectIsTraveller,
	selectSelectedTraveller,
} from '@/store/slices/travellersSlice'

import BaseBadge from '@/components/ui/badge/BaseBadge'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import ImageGallery from '@/components/ui/image-gallery/ImageGallery'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import useScrollToAnchor from '@/pages/traveller-detail/hooks/useScrollToAnchor'

// Cards after the first are spaced apart; the record's own cards get a heavier border
const SECTION = 'not-first:mt-8'
const OWN = 'border-2 border-muted-foreground'
// Three tiles across and two on narrow screens; scroll-mt clears the sticky header when scrolled to via the photos anchor
const IMAGES_LIST =
	'flex scroll-mt-24 list-none flex-wrap gap-x-[2%] gap-y-8 px-0 py-4 [@media(width<=480px)]:gap-x-[4%] [@media(width<=480px)]:gap-y-4 [@media(width<=480px)]:py-2'

const TravellerDetail = () => {
	const { id } = useParams()
	const { hash } = useLocation()
	const dispatch = useDispatch()
	const userId = useSelector(selectUserId)
	const isTraveller = useSelector(selectIsTraveller)
	const selectedTraveller = useSelector(selectSelectedTraveller)

	const [outcome, setOutcome] = useState({ id: null, failed: false })

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

	const shouldScrollToPhotos =
		showProfile && hash === `#${TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}`

	// The photos render after the fetch, so the browser's own hash scrolling has nothing to land on
	const { ref: photosRef } = useScrollToAnchor({
		isActive: shouldScrollToPhotos,
	})

	const heading = (
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

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-left"
			data-cy={TRAVELLER_DETAIL.ROOT}>
			<title>{`${fullName} · ${GLOBAL.SITE_NAME}`}</title>
			{isLoading && heading}
			{isLoading && (
				<div
					className="my-2"
					data-cy={TRAVELLER_DETAIL.SPINNER}>
					<BaseSpinner />
				</div>
			)}
			{!isLoading && !showProfile && (
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
							data-cy={TRAVELLER_DETAIL.BACK_LINK}>
							{TRAVELLER_DETAIL_CONFIG.BACK_LABEL}
						</BaseButton>
					</div>
				</BaseCard>
			)}
			{showProfile && (
				<>
					<BaseCard className={cn(SECTION, isOwnRecord && OWN)}>
						{heading}
						<section data-cy={TRAVELLER_DETAIL.PROFILE}>
							<p
								className="whitespace-pre-line italic"
								data-cy={TRAVELLER_DETAIL.TRIP_DESCRIPTION}>
								{traveller.tripDescription}
							</p>
							<p data-cy={TRAVELLER_DETAIL.DAYS}>
								<strong>Days in city:</strong>{' '}
								{traveller.daysInCity} days
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
						</section>
					</BaseCard>
					{files.length > 0 && (
						<BaseCard className={cn(SECTION, isOwnRecord && OWN)}>
							<ul
								id={TRAVELLER_ITEM_CONFIG.PHOTOS_ANCHOR}
								ref={photosRef}
								className={IMAGES_LIST}
								data-cy={TRAVELLER_DETAIL.IMAGES_LIST}>
								<ImageGallery
									title={fullName}
									urls={files}
									dimensions={traveller?.fileDimensions}
									urlParam={
										TRAVELLER_DETAIL_CONFIG.PHOTO_PARAM
									}
								/>
							</ul>
						</BaseCard>
					)}
					{canContact && (
						<BaseCard className={SECTION}>
							<section data-cy={TRAVELLER_DETAIL.CONTACT_SECTION}>
								<h2>Send {traveller.firstName} a message</h2>
								<div className="flex justify-end">
									<BaseButton
										isLink
										to={`${PATHS.TRAVELLERS}/${id}${TRAVELLER_ITEM_CONFIG.CONTACT_PATH_SEGMENT}`}
										modeType="primary"
										data-cy={TRAVELLER_DETAIL.CONTACT}>
										Contact
									</BaseButton>
								</div>
							</section>
						</BaseCard>
					)}
				</>
			)}
		</main>
	)
}

export default TravellerDetail
