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
	const { pathname, hash } = useLocation()

	// Layout effect so the new page never paints at the old scroll position; the hash is read but not a dependency, as only a path change should scroll
	useLayoutEffect(() => {
		if (hash) return
		window.scrollTo(0, 0)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])
}

export default useScrollToTopOnNavigate
