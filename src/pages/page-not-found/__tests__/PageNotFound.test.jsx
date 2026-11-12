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

	const renderAs = (token) => {
		useSelector.mockImplementation((fn) =>
			fn({ authentication: { token } }),
		)
		render(<PageNotFound />)
		return screen.getByTestId(TEST_IDS.PAGE_NOT_FOUND.ACTION)
	}

	it('renders <main> as the skip link target with its class and data attributes', () => {
		render(<PageNotFound />)

		const main = screen.getByRole('main')

		expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
		expect(main).toHaveAttribute('tabindex', '-1')
		expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
		expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
		expect(main).toHaveAttribute(
			'data-cy-alt',
			TEST_IDS.PAGE_NOT_FOUND.CONTAINER,
		)
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

	it('offers Go to Travellers when logged in', () => {
		const action = renderAs('abc')

		expect(action).toHaveTextContent('Go to Travellers')
		expect(action).toHaveAttribute('href', PATHS.TRAVELLERS)
	})

	it('offers Log in when logged out', () => {
		const action = renderAs(null)

		expect(action).toHaveTextContent('Log in')
		expect(action).toHaveAttribute('href', PATHS.AUTHENTICATION)
	})
})
