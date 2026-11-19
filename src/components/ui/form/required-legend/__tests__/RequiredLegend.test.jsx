import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { REQUIRED_LEGEND } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'

describe('<RequiredLegend />', () => {
	it('renders the required mark followed by the legend word', () => {
		render(<RequiredLegend />)
		const legend = screen.getByTestId(REQUIRED_LEGEND.ROOT)
		expect(legend).toHaveTextContent(`* ${GLOBAL.REQUIRED_LEGEND}`)
		expect(legend.firstElementChild).toHaveTextContent('*')
	})
})
