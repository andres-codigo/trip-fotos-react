import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { PATHS } from '@/constants/paths'

import MainNav from '../main-nav/MainNav'

import headerStyles from './Header.module.scss'

function Header() {
	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)
	return (
		<header
			className={headerStyles.siteHeader}
			data-cy="site-header">
			<h1
				className={headerStyles.siteHeaderTitleLink}
				data-cy="site-header-title-link">
				<Link to={isLoggedIn ? PATHS.TRIPS : PATHS.AUTHENTICATION}>
					Trip Fotos
				</Link>
			</h1>
			<MainNav />
		</header>
	)
}

export default Header
