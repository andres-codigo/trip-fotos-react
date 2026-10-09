import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { TEST_IDS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import Privacy from '@/pages/privacy/Privacy'

import privacyStyles from '@/pages/privacy/privacy.module.scss'

vi.mock('@/components/ui/card/BaseCard', () => ({
	__esModule: true,
	default: ({ children }) => <div data-cy="base-card">{children}</div>,
}))

describe('Privacy', () => {
	describe('Rendering tests', () => {
		it('renders <main> with the shared and page classes', () => {
			render(<Privacy />)

			const main = screen.getByRole('main')

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
			expect(main.className).toMatch(
				new RegExp(privacyStyles.privacyContainer),
			)
		})

		it('<main> element has correct data attributes', () => {
			render(<Privacy />)

			const main = screen.getByRole('main')

			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.PRIVACY.CONTAINER,
			)
		})

		it('renders the page heading and each policy section', () => {
			render(<Privacy />)

			expect(
				screen.getByRole('heading', {
					level: 2,
					name: 'Privacy policy',
				}),
			).toBeInTheDocument()
			expect(
				screen
					.getAllByRole('heading', { level: 3 })
					.map((h) => h.textContent),
			).toEqual([
				'Account data',
				'Traveller registration',
				'Data stored in your browser',
				'Analytics',
				'Your choices',
			])
		})

		it('links to the privacy contact email', () => {
			render(<Privacy />)

			expect(
				screen.getByRole('link', {
					name: 'phones-medleys8x@icloud.com',
				}),
			).toHaveAttribute('href', 'mailto:phones-medleys8x@icloud.com')
		})
	})
})
