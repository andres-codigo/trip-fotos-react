import { useSelector } from 'react-redux'

import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseButton from '@/components/ui/button/BaseButton'

import pageNotFoundStyles from './pageNotFound.module.scss'

const PageNotFound = () => {
	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={[
				'mainContainer',
				pageNotFoundStyles.pageNotFoundContainer,
			].join(' ')}
			data-cy="main-container"
			data-cy-alt="page-not-found-main-container">
			<title>{`Page not found · ${GLOBAL.SITE_NAME}`}</title>
			<BaseCard>
				<h1>This page is not available. Sorry about that.</h1>
				<p>
					Best return to the
					<BaseButton
						isLink
						to={
							isLoggedIn ? PATHS.TRAVELLERS : PATHS.AUTHENTICATION
						}
						data-cy="home-link">
						Trip Fotos
					</BaseButton>
					home page to get back on track.
				</p>
			</BaseCard>
		</main>
	)
}

export default PageNotFound
