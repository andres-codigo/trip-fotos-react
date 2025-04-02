import { baseUrl, topNavigationSelectors } from '../../support/constants';

describe('Desktop > User Login Render Tests', () => {
	beforeEach(() => {
		cy.visit(baseUrl);
	});

	it('The top navigation container displays the app title as a link', () => {
		cy.get(topNavigationSelectors.navHeaderTitleLink).as(
			'navHeaderTitleLink',
		);

		cy.get('@navHeaderTitleLink')
			.should('have.class', 'navHeaderTitleLink')
			.find('a')
			.then(($navHeaderTitleLink) => {
				expect($navHeaderTitleLink.text()).to.equal('Trip Fotos');
			});
	});
});
