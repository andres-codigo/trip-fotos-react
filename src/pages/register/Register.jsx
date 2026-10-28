import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
	registerTraveller,
	selectUploadProgress,
} from '@/store/slices/travellersSlice'
import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '@/constants/travellers'

import BaseCard from '@/components/ui/card/BaseCard'

import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseProgress from '@/components/ui/progress/BaseProgress'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import registerStyles from './Register.module.scss'

const Register = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const uploadProgress = useSelector(selectUploadProgress)
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
			className={`mainContainer cardPage ${registerStyles.registerContainer}`}
			data-cy="main-container"
			data-cy-alt="register-main-container">
			<title>{`Register as a traveller · ${GLOBAL.SITE_NAME}`}</title>
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
					Registering your details, one moment please...
					{uploadProgress ? (
						<BaseProgress
							value={uploadProgress.percent}
							label={GLOBAL.UPLOAD_PROGRESS_LABEL(
								uploadProgress.uploadedFiles,
								uploadProgress.totalFiles,
								uploadProgress.percent,
							)}
						/>
					) : (
						<BaseSpinner />
					)}
				</BaseDialog>
			)}
			<section>
				<BaseCard>
					<TravellerRegistrationForm
						isLoading={isLoading}
						onSubmit={handleRegistrationSubmit}
					/>
				</BaseCard>
			</section>
		</main>
	)
}
export default Register
