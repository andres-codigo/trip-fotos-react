import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { useSelector } from 'react-redux'

import { TEST_IDS } from '@/constants/test'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import PageNotFound from '@/pages/page-not-found/PageNotFound'

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

vi.mock('@/components/ui/card/BaseCard', () => ({
	__esModule: true,
	default: ({ children }) => <div data-cy="base-card">{children}</div>,
}))

vi.mock('@/components/ui/button/BaseButton', () => ({
	__esModule: true,
	default: ({ children, isLink: _isLink, to, ...props }) => (
		<a
			href={to}
			data-cy="base-button"
			{...props}>
			{children}
		</a>
	),
}))

describe('PageNotFound', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('Rendering tests', () => {
		it('<main> is the skip link target', () => {
			render(<PageNotFound />)

			const main = screen.getByRole('main')

			expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
			expect(main).toHaveAttribute('tabindex', '-1')
		})

		it('says the page is not available and why', () => {
			render(<PageNotFound />)

			expect(
				screen.getByRole('heading', {
					level: 1,
					name: 'This page is not available.',
				}),
			).toBeInTheDocument()
			expect(
				screen.getByText(
					'The link may be old, or the trip may have been removed.',
				),
			).toBeInTheDocument()
		})

		it('sets the document title', () => {
			render(<PageNotFound />)

			expect(document.title).toBe(`Page not found · ${GLOBAL.SITE_NAME}`)
		})

		it('renders the <main> element', () => {
			render(<PageNotFound />)

			expect(screen.getByRole('main')).toBeInTheDocument()
		})

		it('applies the mainContainer class to <main>', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: 'abc' } }),
			)

			render(<PageNotFound />)

			const main = screen.getByTestId(TEST_IDS.MAIN_CONTAINER)

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
		})

		it('<main> element has correct data attributes', () => {
			render(<PageNotFound />)
			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.PAGE_NOT_FOUND.CONTAINER,
			)
		})

		it('renders BaseCard as a wrapper for the content', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: 'abc' } }),
			)

			const { container } = render(<PageNotFound />)

			expect(screen.getByTestId(TEST_IDS.BASE_CARD)).toBeInTheDocument()

			expect(
				screen.getByRole('heading', { level: 1 }),
			).toBeInTheDocument()
			expect(container.querySelector('p')).toBeInTheDocument()
			expect(container.querySelector('a')).toBeInTheDocument()
		})

		it('renders BaseButton as a link with correct children', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: 'abc' } }),
			)

			render(<PageNotFound />)

			const baseButton = screen.getByTestId(
				TEST_IDS.PAGE_NOT_FOUND.ACTION,
			)

			expect(baseButton.tagName).toBe('A')
			expect(baseButton).toHaveTextContent('Go to Travellers')
		})

		it('offers Log in when logged out', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: null } }),
			)

			render(<PageNotFound />)

			expect(
				screen.getByTestId(TEST_IDS.PAGE_NOT_FOUND.ACTION),
			).toHaveTextContent('Log in')
		})
	})

	describe('Behaviour tests', () => {
		it('isLoggedIn is true when authentication.token is not null', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: 'abc' } }),
			)
			render(<PageNotFound />)

			const button = screen.getByTestId(TEST_IDS.PAGE_NOT_FOUND.ACTION)
			expect(button.getAttribute('href')).toBe(PATHS.TRAVELLERS)
		})

		it('isLoggedIn is false when authentication.token is null', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: null } }),
			)
			render(<PageNotFound />)

			const button = screen.getByTestId(TEST_IDS.PAGE_NOT_FOUND.ACTION)
			expect(button.getAttribute('href')).toBe(PATHS.AUTHENTICATION)
		})
	})
})
