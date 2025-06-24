import { lazy, Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { PATHS } from '@/constants/paths'

const MainNav = lazy(() => import('../main-nav/MainNav'))

import headerStyles from './Header.module.scss'

function Header() {
	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)
	return (
		<header
			className={headerStyles.siteHeader}
			data-cy="site-header"
			role="banner"
			aria-label="Site header">
			<h1
				className={headerStyles.siteHeaderTitleLink}
				data-cy="site-header-title-link">
				<Link
					to={isLoggedIn ? PATHS.HOME : PATHS.AUTHENTICATION}
					aria-label="Trip Fotos Home">
					Trip Fotos
				</Link>
			</h1>
			<Suspense fallback={null}>
				<MainNav isLoggedIn={isLoggedIn} />
			</Suspense>
		</header>
	)
}

export default Header
