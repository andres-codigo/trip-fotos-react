import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import BaseCard from '@/components/ui/card/BaseCard'

import styles from './register.module.scss'

const Register = () => {
	return (
		<main
			className={`mainContainer ${styles.registerContainer}`}
			data-cy="main-container"
			data-cy-alt="register-main-container">
			<section>
				<BaseCard>
					<TravellerRegistrationForm />
				</BaseCard>
			</section>
		</main>
	)
}
export default Register
