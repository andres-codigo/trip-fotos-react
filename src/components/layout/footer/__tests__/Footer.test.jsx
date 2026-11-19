import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

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
		it('renders the privacy policy link', () => {
			renderFooter()

			const link = screen.getByRole('link', { name: 'Privacy policy' })

			expect(link).toHaveAttribute('href', PATHS.PRIVACY)
		})
	})
})
