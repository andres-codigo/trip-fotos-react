import { lazy, Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'

import { AUTH_FORM_CONFIG } from '@/constants/auth'
import { PATHS } from '@/constants/ui'

import {
	selectAwaitingVerification,
	selectIsAuthenticated,
	selectSessionChecked,
} from '@/store/slices/authenticationSlice'

import BaseButton from '@/components/ui/button/BaseButton'

const MainNav = lazy(() => import('@/components/layout/main-nav/MainNav'))

function Header() {
	// A new account on Check your inbox is shown the signed-out chrome, so its only ways on are in the card
	const isAuthenticated = useSelector(selectIsAuthenticated)
	const awaitingVerification = useSelector(selectAwaitingVerification)
	const isLoggedIn = isAuthenticated && !awaitingVerification
	// Hidden while a saved session is restored, so a signed-in traveller is not offered Log in on every reload
	const sessionChecked = useSelector(selectSessionChecked)
	const { pathname } = useLocation()
	// Travellers is public, so a logged-out visitor needs a way in from every page but the login form and the email-link page, which offers its own next step
	const showLogIn =
		sessionChecked &&
		!isLoggedIn &&
		pathname !== PATHS.AUTHENTICATION &&
		pathname !== PATHS.AUTH_ACTION
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
