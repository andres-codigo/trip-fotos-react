import { lazy, Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { PATHS } from '@/constants/ui'

const MainNav = lazy(() => import('@/components/layout/main-nav/MainNav'))

function Header() {
	const isLoggedIn = useSelector(
		// Treat all falsy as false
		(state) => Boolean(state.authentication.token),
	)
	return (
		<header
			className="fixed z-[1] flex h-20 w-full items-center justify-between bg-primary"
			data-cy="site-header"
			role="banner"
			aria-label="Site header">
			<p
				className="my-[0.67em] text-2xl font-bold"
				data-cy="site-header-title-link">
				<Link
					to={isLoggedIn ? PATHS.HOME : PATHS.AUTHENTICATION}
					className="m-0 px-6 py-3 text-primary-foreground"
					aria-label="Trip Fotos Home">
					Trip Fotos
				</Link>
			</p>
			<Suspense fallback={null}>
				<MainNav isLoggedIn={isLoggedIn} />
			</Suspense>
		</header>
	)
}

export default Header
