import { COMMON_SELECTORS } from '@/constants/test'

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
	it('reserves its height before the image loads and keeps it after', () => {
		cy.intercept('/slow-photo.svg', (req) =>
			req.reply({
				delay: 1000,
				headers: { 'content-type': 'image/svg+xml' },
				body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"></svg>',
			}),
		)
		cy.mount(
			<ul style={{ width: 600 }}>
				<BaseImage
					title="Ada"
					url="/slow-photo.svg"
					dimensions={{ width: 200, height: 100 }}
					onOpen={() => {}}
				/>
			</ul>,
		)

		cy.get(COMMON_SELECTORS.BASE_IMAGE_THUMBNAIL).then(($img) => {
			const before = $img[0].getBoundingClientRect().height
			expect(before).to.be.greaterThan(0)
			cy.wrap($img).should(($loaded) => {
				expect($loaded[0].complete).to.be.true
			})
			cy.wrap($img).then(() => {
				expect($img[0].getBoundingClientRect().height).to.equal(before)
			})
		})
	})

	it('crops the photo into a square tile', () => {
		mountImage()
		cy.get(COMMON_SELECTORS.BASE_IMAGE).should(($tile) => {
			const { width, height } = $tile[0].getBoundingClientRect()
			expect(width).to.be.greaterThan(0)
			expect(height).to.be.closeTo(width, 1)
		})
		cy.get(COMMON_SELECTORS.BASE_IMAGE_THUMBNAIL).should(
			'have.css',
			'object-fit',
			'cover',
		)
	})

	// A ring over the photo has no guaranteed contrast, so the tile draws it outside, past a ground-coloured gap
	it('draws the keyboard focus ring outside the tile, with a gap', () => {
		mountImage()
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).focus()
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).should(
			'have.css',
			'outline-style',
			'none',
		)
		cy.get(COMMON_SELECTORS.BASE_IMAGE).should(($tile) => {
			const style = getComputedStyle($tile[0])
			expect(style.outlineStyle).to.equal('solid')
			expect(style.outlineColor).to.equal('rgb(255, 243, 196)')
			expect(parseFloat(style.outlineOffset)).to.equal(2)
			expect(style.boxShadow).to.contain('rgb(38, 36, 31)')
		})
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
