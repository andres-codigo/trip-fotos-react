import { viewports, topNavigationSelectors } from './constants';

// VIEWPORTS
Cypress.Commands.add('setViewportToMobile', () => {
	cy.window().then((win) => {
		cy.viewport(viewports.mobile.width, win.innerHeight);
	});
});

// TOP NAVIGATION HAMBURGER MENU
Cypress.Commands.add('assertHamburgerMenuState', (isActive) => {
	cy.get(topNavigationSelectors.navHamburgerMenu)
		.invoke('attr', 'class')
		.should(isActive ? 'contain' : 'not.contain', '_active_');
});
