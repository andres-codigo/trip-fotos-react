import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import YouTag from '@/components/travellers/you-tag/YouTag'
import { YOU_TAG } from '@/constants/test'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'

const getTag = () => screen.getByTestId(YOU_TAG.ROOT)

describe('<YouTag />', () => {
	it('renders the "You" label in sentence case', () => {
		render(<YouTag />)

		expect(TRAVELLER_ITEM_CONFIG.YOU_LABEL).toBe('You')
		expect(getTag()).toHaveTextContent(/^You$/)
		expect(getTag()).toHaveClass(
			'rounded-pill',
			'border-accent-text',
			'bg-surface-accent',
			'text-accent-text',
		)
	})

	it('merges a className passed by the parent', () => {
		render(<YouTag className="ml-2" />)

		expect(getTag()).toHaveClass('ml-2', 'text-xs')
	})
})
