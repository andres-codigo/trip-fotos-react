import {
	viewports,
	topNavigationSelectors,
	authenticationFormSelectors,
} from './constants'

// LOGIN
Cypress.Commands.add('login', (email, password) => {
	cy.get(authenticationFormSelectors.emailInput).type(email)
	cy.get(authenticationFormSelectors.passwordInput).type(password)
	cy.get(authenticationFormSelectors.submitButtonLogin).click()
})

// VIEWPORTS
Cypress.Commands.add('setViewportToDesktop', () => {
	cy.window().then((win) => {
		cy.viewport(viewports.desktop.width, win.innerHeight)
	})
})

Cypress.Commands.add('setViewportToMobile', () => {
	cy.window().then((win) => {
		cy.viewport(viewports.mobile.width, win.innerHeight)
	})
})

// HEADER
Cypress.Commands.add('assertHeaderTitleLink', () => {
	cy.get(topNavigationSelectors.siteHeaderTitleLink).as('siteHeaderTitleLink')

	cy.get('@siteHeaderTitleLink')
		.should('have.class', 'siteHeaderTitleLink')
		.find('a')
		.then(($siteHeaderTitleLink) => {
			expect($siteHeaderTitleLink.text()).to.equal('Trip Fotos')
		})
})

// TOP NAVIGATION HAMBURGER MENU
Cypress.Commands.add('assertHamburgerMenuState', (isActive) => {
	cy.get(topNavigationSelectors.navHamburgerMenu)
		.invoke('attr', 'class')
		.should(isActive ? 'contain' : 'not.contain', '_active_')
})
