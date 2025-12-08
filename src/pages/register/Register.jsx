import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'
import registerStyles from './register.module.scss'

const Register = () => {
	return (
		<main
			className={`mainContainer ${registerStyles.registerContainer}`}
			data-cy="main-container"
			data-cy-alt="register-main-container">
			<TravellerRegistrationForm />
		</main>
	)
}

export default Register
