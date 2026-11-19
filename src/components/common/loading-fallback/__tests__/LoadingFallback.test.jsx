import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { ACCESSIBILITY } from '@/constants/ui'
import { TEST_IDS } from '@/constants/test'

import LoadingFallback from '@/components/common/loading-fallback/LoadingFallback'

describe('<LoadingFallback />', () => {
	describe('as a page (isComponent is false)', () => {
		it('renders the spinner in a card inside a main landmark that is the skip link target', () => {
			render(<LoadingFallback isComponent={false} />)

			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
			expect(main).toHaveAttribute('tabindex', '-1')
			const card = screen.getByTestId(TEST_IDS.BASE_CARD)
			expect(main).toContainElement(card)
			expect(card).toContainElement(
				screen.getByTestId(TEST_IDS.SPINNER.CONTAINER),
			)
		})
	})

	describe('as a component (isComponent is true)', () => {
		it('renders no main landmark', () => {
			render(<LoadingFallback isComponent />)

			expect(screen.queryByRole('main')).not.toBeInTheDocument()
		})

		it('shows the spinner inside a card', () => {
			render(<LoadingFallback isComponent />)

			expect(screen.getByTestId(TEST_IDS.BASE_CARD)).toContainElement(
				screen.getByTestId(TEST_IDS.SPINNER.CONTAINER),
			)
		})
	})
})
