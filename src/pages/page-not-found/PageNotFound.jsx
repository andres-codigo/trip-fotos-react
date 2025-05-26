import { PATHS } from '@/constants/paths'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseButton from '@/components/ui/button/BaseButton'

import pageNotFoundStyles from './pageNotFound.module.scss'

const PageNotFound = () => {
	return (
		<section
			className={[
				'pageSection',
				pageNotFoundStyles.pageNotFoundContainer,
			].join(' ')}>
			<BaseCard>
				<h2>This page is not available. Sorry about that.</h2>
				<p>
					Best return to the
					<BaseButton
						isLink
						to={PATHS.HOME}
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
