import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import YouTag from '@/components/travellers/you-tag/YouTag'
import { YOU_TAG } from '@/constants/test'

const getTag = () => screen.getByTestId(YOU_TAG.ROOT)

describe('<YouTag />', () => {
	it('renders the "You" label in sentence case', () => {
		render(<YouTag />)

		expect(getTag()).toHaveTextContent(/^You$/)
	})
})
