import { useEffect, useRef } from 'react'

const SETTLE_MS = 3000
const USER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown']

const useScrollToAnchor = ({ isActive }) => {
	const ref = useRef(null)

	useEffect(() => {
		const element = ref.current
		if (!isActive || !element) return

		const scroll = () => element.scrollIntoView?.()
		scroll()

		// Lazy images have no height until they load, so the page is too short to reach the target at first and every load shifts it
		element.addEventListener('load', scroll, true)

		const stop = () => {
			element.removeEventListener('load', scroll, true)
			USER_SCROLL_EVENTS.forEach((type) =>
				window.removeEventListener(type, stop),
			)
		}
		USER_SCROLL_EVENTS.forEach((type) =>
			window.addEventListener(type, stop, { passive: true }),
		)
		const timer = setTimeout(stop, SETTLE_MS)

		return () => {
			clearTimeout(timer)
			stop()
		}
	}, [isActive])

	return { ref }
}

export default useScrollToAnchor
