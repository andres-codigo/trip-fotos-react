import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const scrollToTop = () => {
	const reduceMotion = window.matchMedia?.(
		'(prefers-reduced-motion: reduce)',
	).matches
	window.scrollTo({
		top: 0,
		left: 0,
		behavior: reduceMotion ? 'auto' : 'smooth',
	})
}

const useScrollToTopOnNavigate = () => {
	const { pathname } = useLocation()

	// Layout effect so the new page never paints at the old scroll position; a hash target scrolls itself once it renders
	useLayoutEffect(() => {
		window.scrollTo(0, 0)
	}, [pathname])
}

export default useScrollToTopOnNavigate
