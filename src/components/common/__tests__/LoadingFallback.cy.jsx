import { PAGE_SELECTORS } from '../../../constants/test/selectors/pages'
import { COMMON_SELECTORS } from '../../../constants/test/selectors/components'

import LoadingFallback from '@/components/common/LoadingFallback'

describe('<LoadingFallback />', () => {
	it('renders BaseCard wrapped in a main element when isComponent is false', () => {
		cy.mount(<LoadingFallback isComponent={false} />)
		cy.get(PAGE_SELECTORS.MAIN_CONTAINER).within(() => {
			cy.get(COMMON_SELECTORS.BASE_CARD).should('exist')
			cy.get(COMMON_SELECTORS.BASE_SPINNER).should('exist')
		})
	})

	it('render BaseCard when isComponent is true', () => {
		cy.mount(<LoadingFallback isComponent={true} />)
		cy.get(PAGE_SELECTORS.MAIN_CONTAINER).should('not.exist')
		cy.get(COMMON_SELECTORS.BASE_CARD).should('exist')
		cy.get(COMMON_SELECTORS.BASE_SPINNER).should('exist')
	})
})
