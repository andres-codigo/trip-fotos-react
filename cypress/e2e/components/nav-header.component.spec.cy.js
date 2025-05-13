import {
	urls,
	user,
	topNavigationSelectors,
	authenticationFormSelectors,
} from '../../support/constants';

describe('Desktop > User Login Render Tests', () => {
	beforeEach(() => {
		cy.visit(urls.cyAuth);
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

describe('Desktop > Hamburger Menu Tests', () => {
	beforeEach(() => {
		cy.visit(urls.cyAuth);

		cy.get(authenticationFormSelectors.emailInput).type(user.email);
		cy.get(authenticationFormSelectors.passwordInput).type(user.password);
		cy.get(authenticationFormSelectors.submitButtonLogin).click();
	});
	it('Toggles the hamburger menu open and closed on mobile viewports', () => {
		cy.setViewportToMobile();

		cy.get(topNavigationSelectors.siteHeader).as('header');
		cy.get('@header')
			.find(topNavigationSelectors.navHamburgerMenu)
			.as('hamburgerMenu');

		// Ensure the menu is initially closed
		cy.assertHamburgerMenuState(false);

		// Click to open the menu
		cy.get('@hamburgerMenu').click();
		cy.assertHamburgerMenuState(true);

		// Click to close the menu
		cy.get('@hamburgerMenu').click();
		cy.assertHamburgerMenuState(false);
	});
});
