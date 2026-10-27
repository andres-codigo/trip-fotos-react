import { COMMON_SELECTORS, DIALOG } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import BaseImage from '@/components/ui/image/BaseImage'

const url =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"></svg>'

const mountImage = (src = url) =>
	cy.mount(
		<ul>
			<BaseImage
				title="Ada"
				url={src}
			/>
		</ul>,
	)

describe('<BaseImage />', () => {
	it('renders the thumbnail with alt text', () => {
		mountImage()
		cy.get(COMMON_SELECTORS.BASE_IMAGE_THUMBNAIL).should(
			'have.attr',
			'alt',
			"Ada's photo",
		)
	})

	it('opens the dialog on click and closes it again', () => {
		mountImage()
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).click()
		cy.get(getByDataCy(DIALOG.TITLE)).should('contain', "Ada's photos")
		cy.get(getByDataCy(DIALOG.BUTTON)).click()
		cy.get(getByDataCy(DIALOG.TITLE)).should('not.exist')
	})

	it('applies the landscape class on load', () => {
		mountImage()
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).click()
		cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL)
			.invoke('attr', 'class')
			.should('match', /landscape/)
	})

	it('shows the fallback when the image fails', () => {
		mountImage('/missing-image.jpg')
		cy.get(COMMON_SELECTORS.BASE_IMAGE_FALLBACK).should(
			'contain',
			GLOBAL.IMAGE_UNAVAILABLE,
		)
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).should('not.exist')
	})

	it('has no axe violations', () => {
		mountImage()

		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).should('exist')
		cy.checkA11y()
	})

	it('has no axe violations in its fallback state', () => {
		mountImage('/missing-image.jpg')

		cy.get(COMMON_SELECTORS.BASE_IMAGE_FALLBACK).should('exist')
		cy.checkA11y()
	})

	it('has no axe violations with the dialog open', () => {
		mountImage()

		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).click()
		cy.get(getByDataCy(DIALOG.TITLE)).should('contain', "Ada's photos")
		// Axe measures colour contrast on what is painted, so wait for the dialog to finish fading in
		cy.get('dialog').should('have.css', 'opacity', '1')
		cy.checkA11y()
	})
})
