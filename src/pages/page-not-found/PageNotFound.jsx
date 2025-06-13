import { useSelector } from 'react-redux'

import { PATHS } from '@/constants/paths'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseButton from '@/components/ui/button/BaseButton'

import pageNotFoundStyles from './pageNotFound.module.scss'

const PageNotFound = () => {
	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)

	return (
		<main
			className={[
				'mainContainer',
				pageNotFoundStyles.pageNotFoundContainer,
			].join(' ')}
			data-cy="page-not-found">
			<BaseCard>
				<h2>This page is not available. Sorry about that.</h2>
				<p>
					Best return to the
					<BaseButton
						isLink
						to={isLoggedIn ? PATHS.TRIPS : PATHS.AUTHENTICATION}
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
