import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { registerTraveller } from '@/store/slices/travellersSlice'
import { ERROR_MESSAGES } from '@/constants/errors'
import { GLOBAL, PATHS } from '@/constants/ui'

import BaseCard from '@/components/ui/card/BaseCard'

import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import registerStyles from './register.module.scss'

const Register = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(false)

	const handleError = () => setError(null)

	const handleRegistrationSubmit = async (formData) => {
		setIsLoading(true)
		try {
			await dispatch(registerTraveller(formData)).unwrap()
			navigate(PATHS.TRAVELLERS)
		} catch (error) {
			setError(error || ERROR_MESSAGES.FAILED_TO_REGISTER_TRAVELLER)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main
			className={`mainContainer ${registerStyles.registerContainer}`}
			data-cy="main-container"
			data-cy-alt="register-main-container">
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={handleError}
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
					<BaseSpinner />
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
