import { MemoryRouter } from 'react-router-dom'

import { COMMON_SELECTORS, DIALOG } from '@/constants/test'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import ImageGallery from '@/components/ui/image-gallery/ImageGallery'

const svg = (width, height) =>
	`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`

const landscape = svg(2400, 1200)
const portrait = svg(1200, 2400)
const landscapeAgain = svg(2400, 1201)

// The phone layout runs to 768px inclusive; wider screens and a phone held sideways put the arrows beside the photo
const viewports = [
	['mobile', 390, 844, 'bottom'],
	['tablet', 768, 1024, 'bottom'],
	['mobile-landscape', 844, 390, 'sides'],
	['laptop', 1024, 768, 'sides'],
	['desktop', 1280, 800, 'sides'],
]

const mountGallery = (
	urls = [landscape, portrait, landscapeAgain],
	initialEntry = '/',
) =>
	cy.mount(
		<MemoryRouter initialEntries={[initialEntry]}>
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

const rect = ($el) => $el[0].getBoundingClientRect()

// The open animation ends at full opacity, so layout read before then is mid-transition
const waitForOpen = () =>
	cy.get('[role="dialog"]').should('have.css', 'opacity', '1')

describe('<ImageGallery />', () => {
	;[
		[390, 844],
		[768, 1024],
		[1280, 800],
	].forEach(([width, height]) => {
		it(`lands every photo in place when stepping with Next at ${width}px`, () => {
			cy.viewport(width, height)
			cy.intercept('GET', '/held.jpg', { delay: 60000, body: '' })
			const urls = [
				svg(1600, 1200),
				svg(900, 1600),
				svg(640, 480),
				'/held.jpg',
				svg(1920, 480),
				'/missing.jpg',
			]
			mountGallery(urls, '/?photo=1')
			urls.forEach((_, position) => {
				if (position > 0)
					cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).click()
				cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
					'have.text',
					`${position + 1} of ${urls.length}`,
				)
				cy.get(COMMON_SELECTORS.IMAGE_GALLERY_TRACK).should(
					($track) => {
						const slide = $track[0].children[position]
						expect(
							slide.getBoundingClientRect().left,
							`photo ${position + 1} left edge`,
						).to.be.closeTo(
							$track[0].getBoundingClientRect().left,
							1,
						)
					},
				)
			})
		})
	})

	it('keeps the open photo in place when the screen is resized or turned', () => {
		cy.viewport(390, 844)
		mountGallery(
			[
				landscape,
				portrait,
				landscapeAgain,
				svg(900, 1600),
				svg(1600, 1200),
			],
			'/?photo=5',
		)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'have.text',
			'5 of 5',
		)
		cy.viewport(844, 390)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_TRACK).should(($track) => {
			const slide = $track[0].children[4]
			expect(slide.getBoundingClientRect().left).to.be.closeTo(
				$track[0].getBoundingClientRect().left,
				1,
			)
		})
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'have.text',
			'5 of 5',
		)
	})

	it('opens the photo a swipe settles on', () => {
		cy.viewport(390, 844)
		mountGallery()
		openAt(0)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_TRACK).then(($track) =>
			cy.wrap($track).scrollTo($track[0].clientWidth * 2, 0),
		)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain',
			'3 of 3',
		)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).should('be.disabled')
	})

	viewports.forEach(([name, width, height, arrows]) => {
		;[
			['landscape', 0],
			['portrait', 1],
		].forEach(([orientation, position]) => {
			it(`fills the screen with a ${orientation} photo on ${name}, arrows at the ${arrows}`, () => {
				let screenWidth = width
				cy.viewport(width, height)
				mountGallery()
				openAt(position)
				waitForOpen()
				// The runner's own scrollbar takes from the window's width, so the screen is the page's client area
				cy.document().then((doc) => {
					screenWidth = doc.documentElement.clientWidth
				})
				cy.get('[role="dialog"]').then(($dialog) => {
					const dialog = rect($dialog)
					expect(dialog.left, 'full width').to.equal(0)
					expect(dialog.top, 'full height').to.equal(0)
					expect(dialog.width).to.equal(screenWidth)
					expect(dialog.height).to.equal(height)
				})
				cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL)
					.should('be.visible')
					.then(($img) => {
						const image = rect($img)
						cy.get(getByDataCy(DIALOG.TITLE)).then(($title) => {
							expect(
								image.top,
								'below the top bar',
							).to.be.at.least(rect($title).bottom)
						})
						cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).then(
							($counter) => {
								expect(
									image.bottom,
									'above the counter',
								).to.be.at.most(rect($counter).top)
							},
						)
						expect(
							Math.abs(image.left - (screenWidth - image.right)),
							'horizontal centring',
						).to.be.lessThan(2)
						cy.get(COMMON_SELECTORS.IMAGE_GALLERY_PREVIOUS).then(
							($previous) => {
								const previous = rect($previous)
								if (arrows === 'bottom') {
									expect(
										previous.top,
										'previous below the photo',
									).to.be.at.least(image.bottom)
								} else {
									expect(
										previous.right,
										'previous left of the photo',
									).to.be.at.most(image.left)
									expect(previous.left).to.be.at.least(0)
								}
							},
						)
						cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).then(
							($next) => {
								const next = rect($next)
								expect(
									next.width,
									'touch target',
								).to.be.at.least(44)
								if (arrows === 'bottom') {
									expect(
										next.top,
										'next below the photo',
									).to.be.at.least(image.bottom)
								} else {
									expect(
										next.left,
										'next right of the photo',
									).to.be.at.least(image.right)
									expect(next.right).to.be.at.most(
										screenWidth,
									)
								}
							},
						)
					})
			})
		})
	})

	it('locks the page scroll behind the open lightbox', () => {
		cy.viewport(1280, 800)
		mountGallery()
		cy.document().then((doc) => {
			doc.body.style.minHeight = '3000px'
		})
		openAt(0)
		waitForOpen()
		cy.document().then((doc) => {
			const scroller = doc.scrollingElement
			const overflow = doc.defaultView.getComputedStyle(doc.body).overflow
			expect(overflow).to.equal('hidden')
			expect(scroller.scrollWidth).to.be.at.most(scroller.clientWidth)
		})
	})

	it('has no axe violations with the lightbox open', () => {
		mountGallery()
		openAt(0)
		waitForOpen()
		cy.checkA11y()
	})
})
