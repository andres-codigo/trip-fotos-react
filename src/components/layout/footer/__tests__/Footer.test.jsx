import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

import { TEST_IDS } from '@/constants/test'
import { PATHS } from '@/constants/ui'

import Footer from '@/components/layout/footer/Footer'

const renderFooter = () =>
	render(
		<MemoryRouter>
			<Footer />
		</MemoryRouter>,
	)

describe('Footer', () => {
	describe('Rendering tests', () => {
		it('renders a <footer> landmark', () => {
			renderFooter()

			expect(screen.getByRole('contentinfo')).toHaveAttribute(
				'data-cy',
				TEST_IDS.FOOTER.SITE_FOOTER,
			)
		})

		it('renders the privacy policy link', () => {
			renderFooter()

			const link = screen.getByRole('link', { name: 'Privacy policy' })

			expect(link).toHaveAttribute('href', PATHS.PRIVACY)
			expect(link).toHaveAttribute(
				'data-cy',
				TEST_IDS.FOOTER.PRIVACY_LINK,
			)
		})
	})
})
