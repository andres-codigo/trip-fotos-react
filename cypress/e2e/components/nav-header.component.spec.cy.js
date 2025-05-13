import { urls, user, topNavigationSelectors } from '../../support/constants';

describe('Viewport Desktop > Not Logged in > Top Navigation Rendering Tests"', () => {
	beforeEach(() => {
		cy.visit(urls.cyAuth);
	});

	it('Displays the title as a link and does not render the hamburger menu', () => {
		cy.setViewportToDesktop();

		cy.get(topNavigationSelectors.siteHeaderTitleLink).as(
			'siteHeaderTitleLink',
		);

		cy.get('@siteHeaderTitleLink')
			.should('have.class', 'siteHeaderTitleLink')
			.find('a')
			.then(($siteHeaderTitleLink) => {
				expect($siteHeaderTitleLink.text()).to.equal('Trip Fotos');
			});

		cy.get(topNavigationSelectors.navHamburgerMenu).should('not.exist');
	});
});

describe('Viewport Mobile > Logged in > Top Navigation Rendering Tests', () => {
	beforeEach(() => {
		cy.visit(urls.cyAuth);
		cy.login(user.email, user.password);
	});

	it('Displays the mobile layout on small screens', () => {
		cy.setViewportToMobile();

		cy.get(topNavigationSelectors.navHamburgerMenu).should('exist');
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
