import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

describe('<LoadingAnnouncement />', () => {
	;[true, false].forEach((isLoading) => {
		it(`has no axe violations ${isLoading ? 'while loading' : 'while idle'}`, () => {
			cy.mount(<LoadingAnnouncement isLoading={isLoading} />)

			cy.checkA11y()
		})
	})
})
