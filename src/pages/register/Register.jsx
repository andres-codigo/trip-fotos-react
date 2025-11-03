import registerStyles from './register.module.scss'

const Register = () => {
	return (
		<main
			className={`mainContainer ${registerStyles.registerContainer}`}
			data-cy="main-container"
			data-cy-alt="register-main-container">
			<h1>Register page</h1>
		</main>
	)
}

export default Register
