import { baseUrl, topNavigationSelectors } from '../../support/constants';

describe('Desktop > User Login Render Tests', () => {
	beforeEach(() => {
		cy.visit(baseUrl);
	});

	it('The top navigation container displays the app title as a link', () => {
		cy.get(topNavigationSelectors.siteHeaderTitleLink).as(
			'siteHeaderTitleLink',
		);

		cy.get('@siteHeaderTitleLink')
			.should('have.class', 'siteHeaderTitleLink')
			.find('a')
			.then(($siteHeaderTitleLink) => {
				expect($siteHeaderTitleLink.text()).to.equal('Trip Fotos');
			});
	});
});
