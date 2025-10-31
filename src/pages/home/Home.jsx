import homeStyles from './home.module.scss'

const Home = () => {
	return (
		<main
			className={['mainContainer', homeStyles.homeContainer].join(' ')}
			data-cy="main-container"
			data-cy-alt="home-main-container">
			<h1>Home page</h1>
		</main>
	)
}

export default Home
