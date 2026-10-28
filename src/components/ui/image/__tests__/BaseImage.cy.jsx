import { COMMON_SELECTORS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseImage from '@/components/ui/image/BaseImage'

const url =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"></svg>'

const mountImage = (src = url, onOpen = () => {}) =>
	cy.mount(
		<ul>
			<BaseImage
				title="Ada"
				url={src}
				onOpen={onOpen}
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

	it('calls onOpen on click', () => {
		const onOpen = cy.stub().as('onOpen')
		mountImage(url, onOpen)
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).click()
		cy.get('@onOpen').should('have.been.calledOnce')
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
})
