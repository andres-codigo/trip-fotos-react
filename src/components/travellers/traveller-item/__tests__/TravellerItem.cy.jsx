import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import TravellerItem from '@/components/travellers/traveller-item/TravellerItem'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import {
	COMMON_SELECTORS,
	TRAVELLER_ITEM,
	TRAVELLER_ITEM_SELECTORS,
} from '@/constants/test'

const traveller = {
	id: 'abc',
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'Loves analytical engines',
	tripStart: '2024-03-05',
	tripEnd: '2024-03-11',
	cities: [
		'tokyo',
		{ id: 'p1', city: 'Paris', region: 'IDF', country: 'France' },
	],
	files: [],
	registered: '2024-03-05T10:00:00.000Z',
}

const photos = (n) =>
	Array.from({ length: n }, (_, i) => `https://example.com/${i}.jpg`)

describe('<TravellerItem />', () => {
	const render = ({ props = {}, auth = {}, isTraveller = false } = {}) => {
		const store = configureTestStore({
			reducer: {
				authentication: authenticationReducer,
				travellers: travellersReducer,
			},
			preloadedState: {
				authentication: {
					...authenticationReducer(undefined, { type: '@@init' }),
					userId: 'me',
					...auth,
				},
				travellers: {
					...travellersReducer(undefined, { type: '@@init' }),
					isTraveller,
				},
			},
		})

		cy.mount(
			<Provider store={store}>
				<MemoryRouter>
					<ul>
						<TravellerItem
							{...traveller}
							{...props}
						/>
					</ul>
				</MemoryRouter>
			</Provider>,
		)
	}

	it('cancels the delete from the keyboard and restores focus', () => {
		cy.intercept('DELETE', '**/travellers/abc.json*').as('deleteTraveller')
		render({ auth: { isAdmin: true } })
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).click()
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_DIALOG).should('be.visible')
		cy.focused().should(
			'have.attr',
			'data-cy',
			TRAVELLER_ITEM.DELETE_CANCEL,
		)
		cy.get('body').type('{esc}')
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_DIALOG).should('not.exist')
		cy.focused().should('have.attr', 'data-cy', TRAVELLER_ITEM.DELETE)
		cy.get('@deleteTraveller.all').should('have.length', 0)
	})

	it('has no axe violations, with a named heading and image buttons', () => {
		render({ props: { files: photos(1) } })
		cy.get('h3').should('have.text', 'Ada Lovelace')
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).should(
			'have.attr',
			'aria-label',
			"View Ada Lovelace's photo",
		)
		cy.checkA11y()
	})
})
