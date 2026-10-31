import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { CITY_SEARCH } from '@/constants/api'
import { TEST_IDS } from '@/constants/test'
import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import Privacy from '@/pages/privacy/Privacy'

vi.mock('@/components/ui/card/BaseCard', () => ({
	__esModule: true,
	default: ({ children }) => <div data-cy="base-card">{children}</div>,
}))

describe('Privacy', () => {
	describe('Rendering tests', () => {
		it('<main> is the skip link target', () => {
			render(<Privacy />)

			const main = screen.getByRole('main')

			expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
			expect(main).toHaveAttribute('tabindex', '-1')
		})

		it('sets the document title', () => {
			render(<Privacy />)

			expect(document.title).toBe(`Privacy policy · ${GLOBAL.SITE_NAME}`)
		})

		it('renders <main> with the shared and page classes', () => {
			render(<Privacy />)

			const main = screen.getByRole('main')

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
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
					level: 1,
					name: 'Privacy policy',
				}),
			).toBeInTheDocument()
			expect(
				screen
					.getAllByRole('heading', { level: 2 })
					.map((h) => h.textContent),
			).toEqual([
				'Account data',
				'Traveller registration',
				'City search',
				'Data stored in your browser',
				'Analytics',
				'Your choices',
			])
		})

		it('credits Photon and OpenStreetMap for city search', () => {
			render(<Privacy />)

			expect(
				screen.getByRole('link', { name: 'Photon' }),
			).toHaveAttribute('href', CITY_SEARCH.PROVIDER_URL)
			expect(
				screen.getByRole('link', {
					name: 'OpenStreetMap contributors',
				}),
			).toHaveAttribute('href', CITY_SEARCH.ATTRIBUTION_URL)
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
