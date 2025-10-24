import { PAGE_SELECTORS } from '../../../../cypress/support/constants/selectors/pages'
import { commonSelectors } from '../../../../cypress/support/constants/selectors/components'

import LoadingFallback from '@/components/common/LoadingFallback'

describe('<LoadingFallback />', () => {
	it('renders BaseCard wrapped in a main element when isComponent is false', () => {
		cy.mount(<LoadingFallback isComponent={false} />)
		cy.get(PAGE_SELECTORS.MAIN_CONTAINER).within(() => {
			cy.get(commonSelectors.baseCard).should('exist')
			cy.get(commonSelectors.baseSpinner).should('exist')
		})
	})

	it('render BaseCard when isComponent is true', () => {
		cy.mount(<LoadingFallback isComponent={true} />)
		cy.get(PAGE_SELECTORS.MAIN_CONTAINER).should('not.exist')
		cy.get(commonSelectors.baseCard).should('exist')
		cy.get(commonSelectors.baseSpinner).should('exist')
	})
})
