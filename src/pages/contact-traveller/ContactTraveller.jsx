import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler'
import { formatMessageTime } from '@/utils/formatMessageTime'
import { formatCity, getCityId } from '@/utils/formatCity'
import { cn } from '@/utils/cn'
import { CONTACT_TRAVELLER } from '@/constants/test'
import {
	CONTACT_TRAVELLER_CONFIG,
	MESSAGES_CONFIG,
} from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT, PATHS } from '@/constants/ui'

import { selectUserId } from '@/store/slices/authenticationSlice'
import { contactTraveller } from '@/store/slices/messagesSlice'
import {
	loadTraveller,
	selectIsTraveller,
	selectIsTravellerCheckedFor,
	selectSelectedTraveller,
	selectTravellers,
} from '@/store/slices/travellersSlice'

import BaseBadge from '@/components/ui/badge/BaseBadge'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'
import ImageGallery from '@/components/ui/image-gallery/ImageGallery'
import InitialsAvatar from '@/components/ui/avatar/InitialsAvatar'
import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'
import TripSummary from '@/components/travellers/trip-summary/TripSummary'

import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

// The side column shows the first three photos, one row of the Travellers card's tiles
const RECIPIENT_PHOTOS = 3
const SIDE_LABEL = 'm-0 hidden text-sm text-text-muted lg:block'

const ContactTraveller = () => {
	const { id } = useParams()
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation()
	const userId = useSelector(selectUserId)
	const isTraveller = useSelector(selectIsTraveller)
	// isTraveller is persisted, so judging before rehydration would bounce allowed users on a hard reload
	const isRehydrated = useSelector(
		(state) => state._persist?.rehydrated ?? true,
	)
	// On a new device the flag starts false, so judging before the login check resolves would bounce a registered traveller
	const isTravellerCheckedFor = useSelector(selectIsTravellerCheckedFor)
	const selectedTraveller = useSelector(selectSelectedTraveller)
	const travellers = useSelector(selectTravellers)

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(null)

	// The page can be reached from the list or the detail page, so either store copy may hold the name
	const traveller =
		selectedTraveller?.id === id
			? selectedTraveller
			: travellers.find((item) => item.id === id)
	// Reply from Messages carries the message it answers in the router state
	const replyTo = location.state?.replyTo ?? null
	const replyName =
		replyTo?.name ||
		[traveller?.firstName, traveller?.lastName].filter(Boolean).join(' ')
	let title = CONTACT_TRAVELLER_CONFIG.FALLBACK_TITLE
	if (replyTo && replyName) {
		title = CONTACT_TRAVELLER_CONFIG.REPLY_TITLE(replyName)
	} else if (traveller?.firstName) {
		title = CONTACT_TRAVELLER_CONFIG.TITLE(traveller.firstName)
	}

	const canContact = id !== userId && isTraveller
	const needsTraveller = canContact && !replyTo && !traveller

	// A link or a reload can open the page without the traveller in the store, which the side column needs
	useEffect(() => {
		if (needsTraveller) {
			dispatch(loadTraveller(id))
		}
	}, [dispatch, id, needsTraveller])
	const recipientName = [traveller?.firstName, traveller?.lastName]
		.filter(Boolean)
		.join(' ')
	const recipientPhotos = (traveller?.files ?? []).slice(0, RECIPIENT_PHOTOS)

	const handleCloseError = () => setError(null)

	const handleSubmit = async ({ message }) => {
		setIsLoading(true)
		setError(null)

		try {
			await dispatch(
				contactTraveller({ travellerId: id, message }),
			).unwrap()

			navigate(replyTo ? PATHS.MESSAGES : PATHS.TRAVELLERS, {
				replace: true,
				state: {
					alertMessage: replyTo
						? CONTACT_TRAVELLER_CONFIG.REPLY_SUCCESS_MESSAGE
						: CONTACT_TRAVELLER_CONFIG.SUCCESS_MESSAGE,
				},
			})
		} catch (error) {
			setError(
				handleApiError(
					error,
					ERROR_MESSAGES.FAILED_TO_CONTACT_TRAVELLER,
				),
			)
			setIsLoading(false)
		}
	}

	if (!isRehydrated || (userId && isTravellerCheckedFor !== userId)) {
		return null
	}

	if (!canContact) {
		return (
			<Navigate
				to={`${PATHS.TRAVELLERS}/${id}`}
				replace
			/>
		)
	}

	// The side column is the quoted message for a reply, else who you are writing to; without either the page stays one column
	const quote = replyTo?.message ? (
		<div className={cn(PAGE_LAYOUT.SECTION_CARD, 'flex flex-col gap-2')}>
			<p className={SIDE_LABEL}>{CONTACT_TRAVELLER_CONFIG.REPLYING_TO}</p>
			<blockquote
				className="m-0 mb-4 rounded-sm bg-surface-sunken px-3 py-2.5 text-sm wrap-anywhere whitespace-pre-line text-text-muted lg:mb-0"
				data-cy={CONTACT_TRAVELLER.REPLY_QUOTE}>
				<p className="m-0 font-medium text-text">
					{CONTACT_TRAVELLER_CONFIG.REPLY_QUOTE(
						replyName || MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
						replyTo.createdAt
							? formatMessageTime(replyTo.createdAt)
							: null,
					)}
				</p>
				<p className="m-0">{replyTo.message}</p>
			</blockquote>
		</div>
	) : null
	// Below 1024px the traveller is one line above the Message field
	const recipient =
		!replyTo && recipientName ? (
			<div
				className={cn(
					PAGE_LAYOUT.SECTION_CARD,
					'mb-4 flex flex-col gap-3 lg:mb-0',
				)}
				data-cy={CONTACT_TRAVELLER.RECIPIENT}>
				<p className={SIDE_LABEL}>
					{CONTACT_TRAVELLER_CONFIG.WRITING_TO}
				</p>
				<div className="flex items-center gap-3">
					<InitialsAvatar name={recipientName} />
					<div className="flex min-w-0 flex-col gap-0.5">
						<p className="m-0 font-bold wrap-anywhere">
							{recipientName}
						</p>
						<TripSummary
							tripStart={traveller.tripStart}
							tripEnd={traveller.tripEnd}
							daysInCity={traveller.daysInCity}
						/>
					</div>
				</div>
				<div
					className="hidden flex-col gap-3 lg:flex"
					data-cy={CONTACT_TRAVELLER.RECIPIENT_DETAILS}>
					{traveller.cities?.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{traveller.cities.map((city) => (
								<BaseBadge
									key={getCityId(city)}
									type={getCityId(city)}
									title={formatCity(city)}
								/>
							))}
						</div>
					)}
					{recipientPhotos.length > 0 && (
						<ul className="m-0 flex list-none flex-wrap gap-x-[2%] p-0">
							<ImageGallery
								title={recipientName}
								urls={recipientPhotos}
								dimensions={traveller.fileDimensions}
								thumbnails={traveller.fileThumbnails}
								alts={traveller.fileAlts}
								sizes={GLOBAL.IMAGE_CARD_THUMBNAIL_SIZES}
							/>
						</ul>
					)}
					<BaseButton
						isLink
						to={`${PATHS.TRAVELLERS}/${id}`}
						className="inline-flex min-h-11 items-center self-start text-text-link underline underline-offset-4"
						data-cy={CONTACT_TRAVELLER.VIEW_TRIP}>
						{CONTACT_TRAVELLER_CONFIG.VIEW_TRIP(
							traveller.firstName,
						)}
					</BaseButton>
				</div>
			</div>
		) : null
	const side = quote ?? recipient

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={'mainContainer cardPage text-left'}
			data-cy={CONTACT_TRAVELLER.ROOT}>
			<title>{`${title} · ${GLOBAL.SITE_NAME}`}</title>
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={handleCloseError}
					data-cy={CONTACT_TRAVELLER.ERROR_DIALOG}>
					{error}
				</BaseDialog>
			)}
			{isLoading && (
				<BaseDialog
					show={true}
					title={CONTACT_TRAVELLER_CONFIG.SENDING_TITLE}
					fixed
					onClose={() => {}}
					data-cy={CONTACT_TRAVELLER.SENDING_DIALOG}>
					{CONTACT_TRAVELLER_CONFIG.SENDING_MESSAGE}
					<BaseSpinner />
				</BaseDialog>
			)}
			<div
				className={cn(
					side ? PAGE_LAYOUT.WIDE : PAGE_LAYOUT.NARROW,
					PAGE_LAYOUT.PAGE_CARD,
				)}>
				{replyTo && (
					<BaseButton
						isLink
						to={PATHS.MESSAGES}
						ariaLabel={CONTACT_TRAVELLER_CONFIG.BACK_TO_MESSAGES}
						className="inline-flex min-h-11 items-center gap-1 text-sm text-text-link underline underline-offset-4"
						data-cy={CONTACT_TRAVELLER.BACK_TO_MESSAGES}>
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
						{CONTACT_TRAVELLER_CONFIG.BACK_TO_MESSAGES}
					</BaseButton>
				)}
				<h1
					className="mt-0 mb-2 text-[1.5rem]"
					data-cy={CONTACT_TRAVELLER.TITLE}>
					{title}
				</h1>
				<RequiredLegend className="mb-4" />
				<div
					className={cn(side && PAGE_LAYOUT.COLUMNS)}
					data-cy={CONTACT_TRAVELLER.COLUMNS}>
					{side}
					<div className={cn(side && PAGE_LAYOUT.SECTION_CARD)}>
						<ContactTravellerForm
							isLoading={isLoading}
							onSubmit={handleSubmit}
						/>
					</div>
				</div>
			</div>
		</main>
	)
}

export default ContactTraveller
