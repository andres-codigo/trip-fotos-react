import { useSelector } from 'react-redux'

import { PATHS } from '@/constants/paths'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseButton from '@/components/ui/button/BaseButton'

import pageNotFoundStyles from './pageNotFound.module.scss'

function PageNotFound() {
	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)

	return (
		<section
			className={[
				'pageSection',
				pageNotFoundStyles.pageNotFoundContainer,
			].join(' ')}>
			<BaseCard>
				<h2>
					This {isLoggedIn} page is not available. Sorry about that.
				</h2>
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
		</section>
	)
}

export default PageNotFound
