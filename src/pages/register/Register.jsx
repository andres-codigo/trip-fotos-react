import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
	registerTraveller,
	selectUploadProgress,
} from '@/store/slices/travellersSlice'
import { selectEmailVerified } from '@/store/slices/authenticationSlice'
import { VERIFY_EMAIL_PROMPT_CONFIG } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT, PATHS } from '@/constants/ui'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '@/constants/travellers'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseProgress from '@/components/ui/progress/BaseProgress'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'
import VerifyEmailNote from '@/components/forms/verify-email-note/VerifyEmailNote'

const TITLE = 'Register as a traveller'

const Register = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const uploadProgress = useSelector(selectUploadProgress)
	const emailVerified = useSelector(selectEmailVerified)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(null)

	const handleCloseError = () => setError(null)

	const handleRegistrationSubmit = async (formData) => {
		setIsLoading(true)
		setError(null)

		try {
			await dispatch(registerTraveller(formData)).unwrap()

			navigate(PATHS.TRAVELLERS, {
				state: {
					alertMessage: TRAVELLER_REGISTRATION_SUCCESS_MESSAGE,
				},
			})
		} catch (error) {
			setError(
				handleApiError(
					error,
					ERROR_MESSAGES.FAILED_TO_REGISTER_TRAVELLER,
				),
			)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={'mainContainer cardPage text-left'}
			data-cy="main-container"
			data-cy-alt="register-main-container">
			<title>{`${TITLE} · ${GLOBAL.SITE_NAME}`}</title>
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={handleCloseError}
					data-cy="invalid-traveller-registration-dialog">
					{error}
				</BaseDialog>
			)}
			{isLoading && (
				<BaseDialog
					show={true}
					title="Registering"
					fixed
					data-cy="registering-dialog">
					{uploadProgress ? (
						<div className="flex flex-col gap-4">
							<span>{GLOBAL.REGISTERING_MESSAGE}</span>
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
							{GLOBAL.REGISTERING_MESSAGE}
							<BaseSpinner />
						</>
					)}
				</BaseDialog>
			)}
			{/* A div, as the unlayered section rule would add padding */}
			<div
				className={
					emailVerified ? PAGE_LAYOUT.WIDE : PAGE_LAYOUT.NARROW
				}>
				{/* The rules refuse an unverified account's trip and photos, so the note stands in for the form */}
				{emailVerified ? (
					<TravellerRegistrationForm
						title={TITLE}
						isLoading={isLoading}
						onSubmit={handleRegistrationSubmit}
					/>
				) : (
					// A card at every width, as the note has no sections to open up into
					<BaseCard>
						<h1 className="mt-0 mb-4 text-[1.5rem]">{TITLE}</h1>
						<VerifyEmailNote
							text={VERIFY_EMAIL_PROMPT_CONFIG.REGISTER_NOTE}
						/>
					</BaseCard>
				)}
			</div>
		</main>
	)
}
export default Register
