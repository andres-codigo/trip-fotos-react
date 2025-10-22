import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

import { API_DATABASE } from '@/constants/api'
import { MOCK_KEYS } from '@/constants/test'

/**
 * UserAuthForm Unit Tests
 *
 * Mocks:
 * - Input: Simplified version that handles custom props (isValid, message, showRequiredMark)
 * - BaseButton: Handles isDisabled/isLink props and converts them to standard DOM attributes
 * - CSS Module: Provides stable class names to prevent import errors in test environment
 *
 * Router: Tests wrap components in BrowserRouter since UserAuthForm uses Router components
 */
import UserAuthForm from '../UserAuthForm'

vi.mock('@/components/ui/form/input/Input', () => ({
	default: ({ label, isValid, message, showRequiredMark, ...props }) => {
		const domProps = { ...props }

		delete domProps.isValid
		delete domProps.message
		delete domProps.showRequiredMark

		return (
			<div>
				<label htmlFor={domProps.id}>
					{label}
					{props.required && showRequiredMark && (
						<span className="input-required">*</span>
					)}
				</label>
				<input
					{...domProps}
					aria-invalid={!isValid}
				/>
				{!isValid && message && <span role="alert">{message}</span>}
			</div>
		)
	},
}))

vi.mock('@/components/ui/button/BaseButton', () => ({
	default: ({ children, isDisabled, isLink, ...restProps }) => {
		const elementProps = {
			...restProps,
			disabled: isDisabled,
		}

		return isLink ? (
			<button
				type="button"
				{...elementProps}>
				{children}
			</button>
		) : (
			<button {...elementProps}>{children}</button>
		)
	},
}))

vi.mock('../UserAuthForm.module.scss', () => ({
	default: {
		userAuthentication: 'userAuthentication',
		userAuthenticationTitle: 'userAuthenticationTitle',
		visuallyHidden: 'visuallyHidden',
		formControl: 'formControl',
		invalidForm: 'invalidForm',
		formActions: 'formActions',
		formSubmitButton: 'formSubmitButton',
		toggleLink: 'toggleLink',
	},
}))

const renderWithRouter = (component) => {
	return render(<BrowserRouter>{component}</BrowserRouter>)
}

// Create default props factory to avoid object recreation
const createDefaultProps = () => ({
	email: {
		value: MOCK_KEYS.EMAIL,
		isValid: true,
		message: '',
	},
	password: {
		value: MOCK_KEYS.PASSWORD,
		isValid: true,
		message: '',
	},
	mode: API_DATABASE.API_AUTH_LOGIN_MODE,
	onEmailChange: vi.fn(),
	onPasswordChange: vi.fn(),
	onSubmit: vi.fn(),
	onSwitchMode: vi.fn(),
	isLoading: false,
})

describe('<UserAuthForm />', () => {
	let defaultProps

	beforeEach(() => {
		// Create fresh props for each test to avoid cross-test pollution
		defaultProps = createDefaultProps()
	})

	describe('Rendering tests', () => {
		it('should have button type="button" for toggle link to prevent form submission', () => {
			renderWithRouter(<UserAuthForm {...defaultProps} />)

			const toggleButton = screen.getByRole('button', {
				name: /switch to signup/i,
			})

			// This verifies preventDefault behavior indirectly
			expect(toggleButton).toHaveAttribute('type', 'button')
		})

		it('should render login mode correctly', () => {
			renderWithRouter(
				<UserAuthForm
					{...defaultProps}
					mode={API_DATABASE.API_AUTH_LOGIN_MODE}
				/>,
			)

			expect(screen.getByText('Login')).toBeInTheDocument()
			expect(screen.getByText('Log in')).toBeInTheDocument()
			expect(screen.getByText('Switch to Signup')).toBeInTheDocument()
		})

		it('should render signup mode correctly', () => {
			renderWithRouter(
				<UserAuthForm
					{...defaultProps}
					mode={API_DATABASE.API_AUTH_SIGNUP_MODE}
				/>,
			)

			expect(screen.getByText('Signup')).toBeInTheDocument()
			expect(screen.getByText('Sign up')).toBeInTheDocument()
			expect(screen.getByText('Switch to Login')).toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		it('should call onSwitchMode when toggle button is clicked', () => {
			const mockOnSwitchMode = vi.fn()

			renderWithRouter(
				<UserAuthForm
					{...defaultProps}
					onSwitchMode={mockOnSwitchMode}
				/>,
			)

			const toggleButton = screen.getByRole('button', {
				name: /switch to signup/i,
			})
			fireEvent.click(toggleButton)

			expect(mockOnSwitchMode).toHaveBeenCalledWith(expect.any(Object))
		})

		it('should be disabled when isLoading is true', () => {
			renderWithRouter(
				<UserAuthForm
					{...defaultProps}
					isLoading={true}
				/>,
			)

			const toggleButton = screen.getByRole('button', {
				name: /switch to signup/i,
			})
			expect(toggleButton).toBeDisabled()
		})
	})

	describe('Accessibility tests', () => {
		it('sets aria-describedby to "email-error" when email is invalid with message', () => {
			const props = {
				...defaultProps,
				email: {
					value: '',
					isValid: false,
					message: 'Email is required',
				},
				password: { value: '', isValid: true, message: '' },
			}

			const { getByLabelText } = renderWithRouter(
				<UserAuthForm {...props} />,
			)
			const emailInput = getByLabelText(/E-Mail/i)

			expect(emailInput).toHaveAttribute(
				'aria-describedby',
				'email-error',
			)
		})

		it('sets aria-describedby to "password-error" when password is invalid with message', () => {
			const props = {
				...defaultProps,
				email: {
					value: defaultProps.email.value,
					isValid: true,
					message: '',
				},
				password: {
					value: '',
					isValid: false,
					message: 'Password is required',
				},
			}

			const { getByLabelText } = renderWithRouter(
				<UserAuthForm {...props} />,
			)
			const passwordInput = getByLabelText(/Password/i)

			expect(passwordInput).toHaveAttribute(
				'aria-describedby',
				'password-error',
			)
		})

		it('sets aria-describedby to undefined when field is valid', () => {
			const props = {
				...defaultProps,
				email: {
					value: defaultProps.email.value,
					isValid: true,
					message: '',
				},
				password: {
					value: defaultProps.password.value,
					isValid: true,
					message: '',
				},
			}

			const { getByLabelText } = renderWithRouter(
				<UserAuthForm {...props} />,
			)
			const emailInput = getByLabelText(/E-Mail/i)
			const passwordInput = getByLabelText(/Password/i)

			expect(emailInput).not.toHaveAttribute('aria-describedby')
			expect(passwordInput).not.toHaveAttribute('aria-describedby')
		})

		it('sets aria-describedby to undefined when field is invalid but has no message', () => {
			const props = {
				...defaultProps,
				email: { value: '', isValid: false, message: '' },
				password: { value: '', isValid: false, message: '' },
			}

			const { getByLabelText } = renderWithRouter(
				<UserAuthForm {...props} />,
			)
			const emailInput = getByLabelText(/E-Mail/i)
			const passwordInput = getByLabelText(/Password/i)

			expect(emailInput).not.toHaveAttribute('aria-describedby')
			expect(passwordInput).not.toHaveAttribute('aria-describedby')
		})
	})
})
