import { VERIFIED_CHIP_SELECTORS } from '@/constants/test'

import VerifiedChip from '@/components/ui/verified-chip/VerifiedChip'

describe('<VerifiedChip />', () => {
	;[true, false].forEach((verified) => {
		it(`has no axe violations when verified is ${verified}`, () => {
			cy.mount(<VerifiedChip verified={verified} />)
			cy.get(VERIFIED_CHIP_SELECTORS.ROOT).should('be.visible')
			cy.checkA11y()
		})
	})
})
