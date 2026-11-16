import { VERIFY_EMAIL_PROMPT_CONFIG } from '@/constants/auth'
import { VERIFY_EMAIL_STRIP_SELECTORS } from '@/constants/test'

import {
	refreshVerification,
	resendVerification,
} from '@/store/slices/authenticationSlice'

import configureTestStore from '@/testUtils/configureTestStore'

import Header from '@/components/layout/header/Header'
import VerifyEmailStrip from '@/components/layout/verify-email-strip/VerifyEmailStrip'

// The prompt and its links share one row from the tablet breakpoint
const ROW_WIDTHS = [768, 1280]

const EMAIL = 'a.rather.long.address.that.must.wrap@example-domain.com'

// Holds every thunk until the spec settles it, so the busy states stay on screen and no call reaches Firebase
const createStore = () => {
	const pending = { settle: null }
	const store = configureTestStore({
		reducer: { authentication: (state = {}) => state },
		preloadedState: { authentication: { userEmail: EMAIL } },
	})
	const dispatch = (action) =>
		typeof action === 'function'
			? new Promise((resolve) => {
					pending.settle = resolve
				})
			: store.dispatch(action)
	return { store: { ...store, dispatch }, pending }
}

const mountStrip = () => {
	const { store, pending } = createStore()
	cy.mountWithProviders(<VerifyEmailStrip />, store)
	return pending
}

const settle = (pending, action) => cy.then(() => pending.settle(action))

describe('<VerifyEmailStrip />', () => {
	it('shows the prompt and both links, with no axe violations', () => {
		mountStrip()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT)
			.should('have.attr', 'role', 'region')
			.and('contain.text', EMAIL)
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).should(
			'have.text',
			VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN,
		)
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.CHECK)
			.should('have.text', VERIFY_EMAIL_PROMPT_CONFIG.CHECK)
			.invoke('outerHeight')
			.should('be.at.least', 44)
		cy.checkA11y()
	})

	it('shows a busy line while sending, then confirms the send', () => {
		const pending = mountStrip()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).click()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.BUSY).should(
			'contain.text',
			VERIFY_EMAIL_PROMPT_CONFIG.SENDING,
		)
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).should('not.exist')
		cy.checkA11y()
		settle(pending, { type: resendVerification.fulfilled.type })
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.MESSAGE)
			.should('have.attr', 'role', 'status')
			.and('have.text', VERIFY_EMAIL_PROMPT_CONFIG.SENT_TO(EMAIL))
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.CHECK).should('not.exist')
		cy.checkA11y()
	})

	it('shows an alert with no links when the send fails', () => {
		const pending = mountStrip()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).click()
		settle(pending, { type: resendVerification.rejected.type })
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.MESSAGE)
			.should('have.attr', 'role', 'alert')
			.and('have.text', VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT)
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).should('not.exist')
		cy.checkA11y()
	})

	it('shows a busy line while checking, then an alert and the links when not verified', () => {
		const pending = mountStrip()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.CHECK).click()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.BUSY).should(
			'contain.text',
			VERIFY_EMAIL_PROMPT_CONFIG.CHECKING,
		)
		settle(pending, {
			type: refreshVerification.fulfilled.type,
			payload: { emailVerified: false },
		})
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.MESSAGE)
			.should('have.attr', 'role', 'alert')
			.and('have.text', VERIFY_EMAIL_PROMPT_CONFIG.NOT_YET)
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).should('be.visible')
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.CHECK).should('be.visible')
		cy.checkA11y()
	})

	it('shows the check-failed alert when the check fails', () => {
		const pending = mountStrip()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.CHECK).click()
		settle(pending, { type: refreshVerification.rejected.type })
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.MESSAGE).should(
			'have.text',
			VERIFY_EMAIL_PROMPT_CONFIG.CHECK_FAILED,
		)
		cy.checkA11y()
	})

	it('wraps a long email inside the strip on mobile', () => {
		cy.setViewportToMobile()
		mountStrip()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT).then(($root) => {
			const root = $root[0].getBoundingClientRect()
			const email = $root
				.find('.wrap-anywhere')[0]
				.getBoundingClientRect()
			expect(email.right).to.be.at.most(root.right)
			expect($root[0].scrollWidth).to.be.at.most($root[0].clientWidth)
			expect(getComputedStyle($root[0]).paddingLeft).to.equal('16px')
		})
	})

	it('centres its content in 1160px on desktop', () => {
		cy.setViewportToDesktop()
		mountStrip()
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT).then(($root) => {
			const style = getComputedStyle($root[0])
			expect(style.paddingLeft).to.equal('24px')
			expect(style.borderBottomWidth).to.equal('1px')
			expect(style.borderTopWidth).to.equal('0px')
			const inner = $root.children()[0].getBoundingClientRect()
			const root = $root[0].getBoundingClientRect()
			expect(inner.width).to.equal(1160)
			expect(inner.left - root.left).to.be.closeTo(
				root.right - inner.right,
				1,
			)
		})
	})

	ROW_WIDTHS.forEach((width) => {
		it(`puts the prompt and its links on one row at ${width}px`, () => {
			cy.viewport(width, 800)
			mountStrip()
			cy.get(`${VERIFY_EMAIL_STRIP_SELECTORS.ROOT} p`).then(($text) => {
				const text = $text[0].getBoundingClientRect()
				cy.get(VERIFY_EMAIL_STRIP_SELECTORS.CHECK).should(($link) => {
					const link = $link[0].getBoundingClientRect()
					expect(link.left).to.be.greaterThan(text.right)
					expect(link.top).to.be.lessThan(text.bottom)
				})
			})
		})
	})

	describe('under the fixed header', () => {
		const topElementAt = (el) => {
			const rect = el.getBoundingClientRect()
			return el.ownerDocument.elementFromPoint(
				rect.left + rect.width / 2,
				rect.top + rect.height / 2,
			)
		}

		beforeEach(() => {
			cy.createMockStore(true).then((store) =>
				cy.mountWithProviders(
					<>
						<Header />
						<VerifyEmailStrip />
						<main className="mainContainer cardPage">
							<h1>Travellers</h1>
							<div style={{ height: 2000 }} />
						</main>
					</>,
					store,
				),
			)
		})

		it('sits below the header, with its links on top of the page', () => {
			cy.get('header').then(($header) => {
				cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT).should(($strip) => {
					expect($strip[0].getBoundingClientRect().top).to.equal(
						$header[0].getBoundingClientRect().bottom,
					)
				})
			})
			cy.get(VERIFY_EMAIL_STRIP_SELECTORS.SEND_AGAIN).should(($link) => {
				expect(topElementAt($link[0])).to.equal($link[0])
			})
			// The page's own top padding clears the strip, not just the header
			cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT).then(($strip) => {
				cy.get('h1').should(($heading) => {
					expect(
						$heading[0].getBoundingClientRect().top,
					).to.be.greaterThan(
						$strip[0].getBoundingClientRect().bottom,
					)
				})
			})
		})

		it('scrolls away under the header', () => {
			cy.scrollTo(0, 60)
			cy.get('header').should(($header) => {
				expect($header[0].contains(topElementAt($header[0]))).to.equal(
					true,
				)
			})
		})
	})
})
