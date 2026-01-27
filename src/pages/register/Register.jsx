import { useState } from 'react'

import { GLOBAL } from '@/constants/ui'

import BaseCard from '@/components/ui/card/BaseCard'

import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import registerStyles from './register.module.scss'

const Register = () => {
	const [isLoading] = useState(false)
	const [error, setError] = useState(false)

	const handleError = () => setError(null)

	const handleRegistrationSubmit = (formData) => {
		console.log('Page received data:', formData)
		// TODO: dispatch(registerUser(formData))
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
