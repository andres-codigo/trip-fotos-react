import MainNav from '../main-nav/MainNav'

import headerStyles from './Header.module.scss'

function Header() {
	return (
		<header
			className={headerStyles.siteHeader}
			data-cy="site-header">
			<MainNav />
		</header>
	)
}

export default Header
