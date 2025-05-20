import { PATHS } from '@/constants/paths'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseButton from '@/components/ui/button/BaseButton'

import pageNotFoundStyles from './pageNotFound.module.scss'

const PageNotFound = () => {
	return (
		<section className={pageNotFoundStyles.pageNotFoundContainer}>
			<BaseCard>
				<h2>This page isn&apos;t available. Sorry about that.</h2>
				<p>
					Best return to the
					<BaseButton
						isLink
						to={PATHS.HOME}>
						Trip Fotos
					</BaseButton>
					home page to get back on track.
				</p>
			</BaseCard>
		</section>
	)
}

export default PageNotFound
