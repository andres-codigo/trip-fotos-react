import { MemoryRouter } from 'react-router-dom'

import { COMMON_SELECTORS, DIALOG } from '@/constants/test'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import ImageGallery from '@/components/ui/image-gallery/ImageGallery'

const svg = (width, height) =>
	`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`

const landscape = svg(2400, 1200)
const portrait = svg(1200, 2400)
const landscapeAgain = svg(2400, 1201)

const viewports = [
	['mobile', 390, 844],
	['tablet', 768, 1024],
	['laptop', 1024, 768],
	['desktop', 1280, 800],
]

const mountGallery = (urls = [landscape, portrait, landscapeAgain]) =>
	cy.mount(
		<MemoryRouter>
			<ul>
				<ImageGallery
					title="Ada"
					urls={urls}
					urlParam="photo"
				/>
			</ul>
		</MemoryRouter>,
	)

const openAt = (position) =>
	cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).eq(position).click()

describe('<ImageGallery />', () => {
	it('steps through the photos with next and previous', () => {
		mountGallery()
		openAt(0)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain',
			'1 of 3',
		)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_PREVIOUS).should('be.disabled')
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).click()
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain',
			'2 of 3',
		)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_PREVIOUS).click()
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain',
			'1 of 3',
		)
	})

	it('steps with the arrow keys and closes with Escape', () => {
		mountGallery()
		openAt(0)
		cy.get('body').type('{rightarrow}')
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain',
			'2 of 3',
		)
		cy.get('body').type('{leftarrow}')
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain',
			'1 of 3',
		)
		cy.get('body').type('{esc}')
		cy.get(getByDataCy(DIALOG.TITLE)).should('not.exist')
	})

	viewports.forEach(([name, width, height]) => {
		;[
			['landscape', 0],
			['portrait', 1],
		].forEach(([orientation, position]) => {
			it(`fits and centres a ${orientation} photo on ${name}`, () => {
				cy.viewport(width, height)
				mountGallery()
				openAt(position)
				cy.get('dialog').should('have.css', 'opacity', '1')
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL).then(($img) => {
					const image = $img[0].getBoundingClientRect()
					const dialog = $img
						.closest('dialog')[0]
						.getBoundingClientRect()
					expect(image.width, 'image width').to.be.greaterThan(0)
					expect(image.left, 'inside left').to.be.at.least(
						dialog.left,
					)
					expect(image.right, 'inside right').to.be.at.most(
						dialog.right,
					)
					expect(image.top, 'inside top').to.be.at.least(dialog.top)
					expect(image.bottom, 'inside bottom').to.be.at.most(
						dialog.bottom,
					)
					const leftGap = image.left - dialog.left
					const rightGap = dialog.right - image.right
					expect(
						Math.abs(leftGap - rightGap),
						'horizontal centring',
					).to.be.lessThan(2)
				})
				cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).then(($next) => {
					const next = $next[0].getBoundingClientRect()
					cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL).then(($img) => {
						const image = $img[0].getBoundingClientRect()
						expect(
							next.left,
							'next sits right of image',
						).to.be.at.least(image.right)
					})
				})
			})
		})
	})

	it('has no axe violations with the dialog open', () => {
		mountGallery()
		openAt(0)
		cy.get('dialog').should('have.css', 'opacity', '1')
		cy.checkA11y()
	})
})
