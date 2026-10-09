import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import homeStyles from './home.module.scss'

const Home = () => {
	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={['mainContainer', homeStyles.homeContainer].join(' ')}
			data-cy="main-container"
			data-cy-alt="home-main-container">
			<title>{`Home · ${GLOBAL.SITE_NAME}`}</title>
			<h1>Home page</h1>
		</main>
	)
}

export default Home
