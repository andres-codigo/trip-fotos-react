import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { useSelector } from 'react-redux'

import { TEST_IDS } from '@/constants/test'
import { GLOBAL, PATHS } from '@/constants/ui'

import PageNotFound from '../PageNotFound'

import pageNotFoundStyles from '../pageNotFound.module.scss'

/**
 * PageNotFound Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering logic, conditional class application, and link behavior
 * - Complements Cypress tests which cover E2E navigation and visibility
 * - Tests conditional rendering logic for authentication state (isLoggedIn)
 * - Verifies correct className composition and structure
 * - Ensures correct link destination and text based on authentication state
 * - Uses mocks for redux, routing, and UI components to isolate logic
 */

vi.mock('react-redux', () => ({
	useSelector: vi.fn(),
}))

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
		it('renders the <main> element', () => {
			render(<PageNotFound />)

			const main = screen.getByRole('main')
			expect(main).toBeInTheDocument()
		})

		it('applies both mainContainer and pageNotFoundContainer classes to <main>', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: 'abc' } }),
			)

			render(<PageNotFound />)

			const main = screen.getByTestId(TEST_IDS.MAIN_CONTAINER)

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
			expect(main.className).toMatch(
				new RegExp(pageNotFoundStyles.pageNotFoundContainer),
			)
		})

		it('renders BaseCard as a wrapper for the content', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: 'abc' } }),
			)

			const { container } = render(<PageNotFound />)

			expect(screen.getByTestId(TEST_IDS.BASE_CARD)).toBeInTheDocument()

			expect(
				screen.getByRole('heading', { level: 2 }),
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
				TEST_IDS.PAGE_NOT_FOUND.HOME_LINK,
			)

			expect(baseButton).toBeInTheDocument()
			expect(baseButton.tagName).toBe('A')
			expect(baseButton).toHaveTextContent('Trip Fotos')
		})
	})

	describe('Behaviour tests', () => {
		it('isLoggedIn is true when authentication.token is not null', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: 'abc' } }),
			)
			render(<PageNotFound />)

			const button = screen.getByTestId(TEST_IDS.PAGE_NOT_FOUND.HOME_LINK)
			expect(button.getAttribute('href')).toBe(PATHS.TRAVELLERS)
		})

		it('isLoggedIn is false when authentication.token is null', () => {
			useSelector.mockImplementation((fn) =>
				fn({ authentication: { token: null } }),
			)
			render(<PageNotFound />)

			const button = screen.getByTestId(TEST_IDS.PAGE_NOT_FOUND.HOME_LINK)
			expect(button.getAttribute('href')).toBe(PATHS.AUTHENTICATION)
		})
	})
})
