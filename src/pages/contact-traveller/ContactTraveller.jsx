import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler'
import { CONTACT_TRAVELLER } from '@/constants/test'
import { CONTACT_TRAVELLER_CONFIG } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import {
	selectUserEmail,
	selectUserId,
} from '@/store/slices/authenticationSlice'
import { contactTraveller } from '@/store/slices/messagesSlice'
import {
	selectIsTraveller,
	selectIsTravellerCheckedFor,
	selectSelectedTraveller,
	selectTravellers,
} from '@/store/slices/travellersSlice'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

import contactTravellerStyles from './ContactTraveller.module.scss'

const ContactTraveller = () => {
	const { id } = useParams()
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const userEmail = useSelector(selectUserEmail)
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
	const title = traveller?.firstName
		? CONTACT_TRAVELLER_CONFIG.TITLE(traveller.firstName)
		: CONTACT_TRAVELLER_CONFIG.FALLBACK_TITLE

	const canContact = id !== userId && isTraveller

	const handleCloseError = () => setError(null)

	const handleSubmit = async ({ email, message }) => {
		setIsLoading(true)
		setError(null)

		try {
			await dispatch(
				contactTraveller({ travellerId: id, email, message }),
			).unwrap()

			navigate(PATHS.TRAVELLERS, {
				replace: true,
				state: {
					alertMessage: CONTACT_TRAVELLER_CONFIG.SUCCESS_MESSAGE,
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
			className={`mainContainer cardPage ${contactTravellerStyles.contactTravellerContainer}`}
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
				<h1
					className={contactTravellerStyles.title}
					data-cy={CONTACT_TRAVELLER.TITLE}>
					{title}
				</h1>
				{/* The form seeds its email once, so remount when the session email arrives after rehydration */}
				<ContactTravellerForm
					key={userEmail ?? ''}
					userEmail={userEmail ?? ''}
					isLoading={isLoading}
					onSubmit={handleSubmit}
				/>
			</BaseCard>
		</main>
	)
}

export default ContactTraveller
