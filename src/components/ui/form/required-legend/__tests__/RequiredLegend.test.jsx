import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { REQUIRED_LEGEND } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'

describe('<RequiredLegend />', () => {
	it('renders the required mark followed by the legend word', () => {
		render(<RequiredLegend />)
		const legend = screen.getByText(
			(_, element) => element?.dataset.cy === REQUIRED_LEGEND.ROOT,
		)
		expect(legend.tagName).toBe('P')
		expect(legend).toHaveTextContent(`* ${GLOBAL.REQUIRED_LEGEND}`)
		expect(legend.firstElementChild).toHaveTextContent('*')
		expect(legend.firstElementChild).toHaveClass('text-danger-text')
	})

	it('merges a caller className last', () => {
		render(<RequiredLegend className="text-text" />)
		const legend = screen.getByText(
			(_, element) => element?.dataset.cy === REQUIRED_LEGEND.ROOT,
		)
		expect(legend).toHaveClass('text-text')
		expect(legend).not.toHaveClass('text-text-muted')
	})
})
