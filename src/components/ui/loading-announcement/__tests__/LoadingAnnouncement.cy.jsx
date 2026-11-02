import { ACCESSIBILITY } from '@/constants/ui'

import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

describe('<LoadingAnnouncement />', () => {
	it('announces the loading message and has no axe violations', () => {
		cy.mount(<LoadingAnnouncement isLoading />)

		cy.contains(ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE).should('exist')
		cy.checkA11y()
	})

	it('has no axe violations while idle', () => {
		cy.mount(<LoadingAnnouncement isLoading={false} />)

		cy.checkA11y()
	})
})
