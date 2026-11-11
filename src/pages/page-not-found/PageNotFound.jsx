import { useSelector } from 'react-redux'

import { TEST_IDS } from '@/constants/test'

import {
	ACCESSIBILITY,
	GLOBAL,
	PAGE_NOT_FOUND_CONFIG,
	PATHS,
} from '@/constants/ui'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseButton from '@/components/ui/button/BaseButton'

const PageNotFound = () => {
	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-center"
			data-cy="main-container"
			data-cy-alt="page-not-found-main-container">
			<title>{`Page not found · ${GLOBAL.SITE_NAME}`}</title>
			<BaseCard>
				<h1 className="my-[0.83em] text-[1.5rem]">
					{PAGE_NOT_FOUND_CONFIG.TITLE}
				</h1>
				<p className="text-text-muted">{PAGE_NOT_FOUND_CONFIG.TEXT}</p>
				<BaseButton
					isLink
					modeType="primary"
					to={isLoggedIn ? PATHS.TRAVELLERS : PATHS.AUTHENTICATION}
					data-cy={TEST_IDS.PAGE_NOT_FOUND.ACTION}>
					{isLoggedIn
						? PAGE_NOT_FOUND_CONFIG.TRAVELLERS_LABEL
						: PAGE_NOT_FOUND_CONFIG.LOG_IN_LABEL}
				</BaseButton>
			</BaseCard>
		</main>
	)
}

export default PageNotFound
