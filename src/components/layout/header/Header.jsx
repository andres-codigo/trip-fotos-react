import { lazy, Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'

import { AUTH_FORM_CONFIG } from '@/constants/auth'
import { PATHS } from '@/constants/ui'

import BaseButton from '@/components/ui/button/BaseButton'

const MainNav = lazy(() => import('@/components/layout/main-nav/MainNav'))

function Header() {
	const isLoggedIn = useSelector(
		// Treat all falsy as false
		(state) => Boolean(state.authentication.token),
	)
	const { pathname } = useLocation()
	// Travellers is public, so a logged-out visitor needs a way in from every page but the login form itself
	const showLogIn = !isLoggedIn && pathname !== PATHS.AUTHENTICATION
	return (
		<header
			className="fixed z-[1] flex h-20 w-full items-center justify-between bg-header pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)]"
			data-cy="site-header"
			role="banner"
			aria-label="Site header">
			<p
				className="my-[0.67em] text-2xl font-bold"
				data-cy="site-header-title-link">
				<Link
					to={PATHS.TRAVELLERS}
					className="m-0 px-6 py-3 text-on-header"
					aria-label="Trip Fotos Home">
					Trip Fotos
				</Link>
			</p>
			<Suspense fallback={null}>
				<MainNav isLoggedIn={isLoggedIn} />
			</Suspense>
			{showLogIn && (
				<BaseButton
					isLink
					to={PATHS.AUTHENTICATION}
					modeType="outline"
					className="mr-4 mobile:mr-2"
					data-cy="site-header-log-in">
					{AUTH_FORM_CONFIG.LOGIN_TITLE}
				</BaseButton>
			)}
		</header>
	)
}

export default Header
