import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { ACCESSIBILITY } from '@/constants/ui'

import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

describe('<LoadingAnnouncement />', () => {
	it('announces the loading message while loading', () => {
		const { container } = render(<LoadingAnnouncement isLoading />)

		const region = container.querySelector('[aria-live="polite"]')
		expect(region).toHaveTextContent(ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE)
	})

	it.each([false, undefined])(
		'is empty but stays in the DOM when isLoading is %s',
		(isLoading) => {
			const { container } = render(
				<LoadingAnnouncement isLoading={isLoading} />,
			)

			const region = container.querySelector('[aria-live="polite"]')
			expect(region).toBeInTheDocument()
			expect(region).toBeEmptyDOMElement()
		},
	)

	it('is visually hidden off-screen', () => {
		const { container } = render(<LoadingAnnouncement isLoading />)

		expect(container.firstChild).toHaveStyle({
			position: 'absolute',
			left: '-9999px',
		})
	})
})
