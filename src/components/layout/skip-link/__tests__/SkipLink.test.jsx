import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { TEST_IDS } from '@/constants/test'
import { ACCESSIBILITY } from '@/constants/ui'

import SkipLink from '@/components/layout/skip-link/SkipLink'

describe('SkipLink', () => {
	describe('Rendering tests', () => {
		it('renders a link to the main content', () => {
			render(<SkipLink />)

			const link = screen.getByRole('link', {
				name: 'Skip to main content',
			})

			expect(link).toHaveAttribute(
				'href',
				`#${ACCESSIBILITY.MAIN_CONTENT_ID}`,
			)
			expect(link).toHaveAttribute('data-cy', TEST_IDS.SKIP_LINK)
		})
	})
})
