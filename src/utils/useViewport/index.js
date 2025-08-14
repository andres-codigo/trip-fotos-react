import { useState, useEffect } from 'react'
import { GLOBAL } from '@/constants/global.js'

/**
 * Custom hook to detect viewport size with debouncing to prevent layout thrashing
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns {object} Object containing viewport detection booleans
 */
const useViewport = (debounceMs = 100) => {
	const [viewport, setViewport] = useState(() => {
		// Initial state based on current window size
		/* c8 ignore start */
		if (typeof window === 'undefined') {
			return {
				isMobile: false,
				isTablet: false,
				isDesktop: true,
				width: 0,
			}
		}
		/* c8 ignore end */

		const width = window.innerWidth
		return {
			isMobile: width <= GLOBAL.BREAKPOINT.MOBILE,
			isTablet:
				width > GLOBAL.BREAKPOINT.MOBILE &&
				width <= GLOBAL.BREAKPOINT.TABLET,
			isDesktop: width > GLOBAL.BREAKPOINT.TABLET,
			width,
		}
	})

	useEffect(() => {
		let timeoutId

		const handleResize = () => {
			// Clear previous timeout
			clearTimeout(timeoutId)

			// Debounce the resize handler
			timeoutId = setTimeout(() => {
				const width = window.innerWidth
				setViewport({
					isMobile: width <= GLOBAL.BREAKPOINT.MOBILE,
					isTablet:
						width > GLOBAL.BREAKPOINT.MOBILE &&
						width <= GLOBAL.BREAKPOINT.TABLET,
					isDesktop: width > GLOBAL.BREAKPOINT.TABLET,
					width,
				})
			}, debounceMs)
		}

		// Add event listener
		window.addEventListener('resize', handleResize)

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize)
			clearTimeout(timeoutId)
		}
	}, [debounceMs])

	return viewport
}

export default useViewport
