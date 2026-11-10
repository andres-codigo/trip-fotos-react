import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler'
import { formatMessageTime } from '@/utils/formatMessageTime'
import { CONTACT_TRAVELLER } from '@/constants/test'
import {
	CONTACT_TRAVELLER_CONFIG,
	MESSAGES_CONFIG,
} from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import { selectUserId } from '@/store/slices/authenticationSlice'
import { contactTraveller } from '@/store/slices/messagesSlice'
import {
	selectIsTraveller,
	selectIsTravellerCheckedFor,
	selectSelectedTraveller,
	selectTravellers,
} from '@/store/slices/travellersSlice'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

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
			<BaseCard>
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
					className="mt-0 mb-[0.83em] text-[1.5rem]"
					data-cy={CONTACT_TRAVELLER.TITLE}>
					{title}
				</h1>
				{replyTo?.message && (
					<blockquote
						className="m-0 mb-4 rounded-sm bg-surface-sunken px-3 py-2.5 text-sm wrap-anywhere whitespace-pre-line text-text-muted"
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
				)}
				<ContactTravellerForm
					isLoading={isLoading}
					onSubmit={handleSubmit}
				/>
			</BaseCard>
		</main>
	)
}

export default ContactTraveller
