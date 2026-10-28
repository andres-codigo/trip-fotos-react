import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { PROGRESS } from '@/constants/test'

import BaseProgress from '@/components/ui/progress/BaseProgress'

describe('BaseProgress', () => {
	it('renders a progress bar at the given value out of 100', () => {
		render(
			<BaseProgress
				value={40}
				label="Uploading"
			/>,
		)

		const bar = screen.getByRole('progressbar')
		expect(bar).toHaveAttribute('value', '40')
		expect(bar).toHaveAttribute('max', '100')
	})

	it('shows the label and names the bar with it', () => {
		render(
			<BaseProgress
				value={0}
				label="Uploading photos"
			/>,
		)

		expect(screen.getByTestId(PROGRESS.LABEL)).toHaveTextContent(
			'Uploading photos',
		)
		expect(
			screen.getByRole('progressbar', { name: 'Uploading photos' }),
		).toBeInTheDocument()
	})

	it('falls back to the percentage as text content', () => {
		render(
			<BaseProgress
				value={75}
				label="Uploading"
			/>,
		)

		expect(screen.getByTestId(PROGRESS.BAR)).toHaveTextContent('75%')
	})
})
