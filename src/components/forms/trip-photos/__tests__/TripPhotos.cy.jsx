import { useState } from 'react'
import PropTypes from 'prop-types'

import TripPhotos from '@/components/forms/trip-photos/TripPhotos'

import { TRIP_PHOTOS_SELECTORS } from '@/constants/test'
import { TRIP_PHOTOS_CONFIG } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'

// Inline SVG data URLs, so the tiles render without a network request
const photoUrl = (colour) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${colour}"/></svg>`,
	)}`

const PHOTOS = ['#7a8f5c', '#c9a46b', '#5c7a8f'].map((colour) => ({
	url: photoUrl(colour),
	dimensions: { width: 40, height: 40 },
	thumbnails: null,
}))

const StatefulTripPhotos = ({ photos, newCount = 0 }) => {
	const [removedUrls, setRemovedUrls] = useState([])
	const [alts, setAlts] = useState({})

	return (
		<TripPhotos
			photos={photos}
			removedUrls={removedUrls}
			newCount={newCount}
			alts={alts}
			onAltChange={(url, alt) =>
				setAlts((current) => ({ ...current, [url]: alt }))
			}
			onRemove={(url) => setRemovedUrls((urls) => [...urls, url])}
			onUndo={(url) =>
				setRemovedUrls((urls) => urls.filter((item) => item !== url))
			}
		/>
	)
}

StatefulTripPhotos.propTypes = {
	photos: TripPhotos.propTypes.photos,
	newCount: PropTypes.number,
}

describe('<TripPhotos />', () => {
	// The form card is about 600px wide from tablet up and about 326px on a 390px phone
	;[600, 326].forEach((cardWidth) => {
		it(`fits the "Will be removed" label inside its tile in a ${cardWidth}px card`, () => {
			cy.viewport(1280, 900)
			cy.mount(
				<div style={{ width: cardWidth }}>
					<StatefulTripPhotos photos={PHOTOS} />
				</div>,
			)
			cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).first().click()
			cy.get(TRIP_PHOTOS_SELECTORS.REMOVED).then(($label) => {
				const tile = $label[0].closest('li').getBoundingClientRect()
				const range = document.createRange()
				range.selectNodeContents($label[0])
				const box = range.getBoundingClientRect()
				// At least 8px clear on each side, so the text never meets the tile edge
				expect(box.left - tile.left).to.be.at.least(8)
				expect(tile.right - box.right).to.be.at.least(8)
			})
		})
	})

	it('has no axe violations at rest, with a removal, the last-photo hint and no photos', () => {
		cy.mount(<StatefulTripPhotos photos={PHOTOS} />)
		cy.get(TRIP_PHOTOS_SELECTORS.TILE).should('have.length', 3)
		cy.checkA11y()

		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).first().click()
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVED).should('be.visible')
		cy.checkA11y()

		cy.mount(<StatefulTripPhotos photos={PHOTOS.slice(0, 1)} />)
		cy.get(TRIP_PHOTOS_SELECTORS.LAST_PHOTO_HINT).should('be.visible')
		cy.checkA11y()

		cy.mount(
			<TripPhotos
				photos={[]}
				onRemove={cy.stub()}
				onUndo={cy.stub()}
				onAltChange={cy.stub()}
			/>,
		)
		cy.get(TRIP_PHOTOS_SELECTORS.ROOT).should(
			'have.text',
			TRIP_PHOTOS_CONFIG.EMPTY_HINT,
		)
		cy.checkA11y()
	})

	// A 390px phone shows two columns in a 326px card, tablet up four in 600px
	;[
		{ viewport: 390, cardWidth: 326, columns: 2 },
		{ viewport: 1280, cardWidth: 600, columns: 4 },
	].forEach(({ viewport, cardWidth, columns }) => {
		it(`puts each alt field under its photo, inside the tile, ${columns} to a row in a ${cardWidth}px card`, () => {
			cy.viewport(viewport, 900)
			cy.mount(
				<div style={{ width: cardWidth }}>
					<StatefulTripPhotos
						photos={[...PHOTOS, ...PHOTOS].map((photo, i) => ({
							...photo,
							url: `${photo.url}#${i}`,
						}))}
					/>
				</div>,
			)

			cy.get(TRIP_PHOTOS_SELECTORS.TILE).then(($tiles) => {
				const tops = [...$tiles].map(
					(tile) => tile.getBoundingClientRect().top,
				)
				expect(tops.filter((top) => top === tops[0])).to.have.length(
					columns,
				)

				$tiles.each((_, tile) => {
					const box = tile.getBoundingClientRect()
					const photo = tile.firstElementChild.getBoundingClientRect()
					const alt = tile
						.querySelector(TRIP_PHOTOS_SELECTORS.ALT_INPUT)
						.getBoundingClientRect()
					expect(alt.top).to.be.at.least(photo.bottom)
					expect(alt.left).to.be.at.least(box.left)
					expect(alt.right).to.be.at.most(box.right)
				})
			})
		})
	})

	it('keeps the alt text typed for a photo and locks it while the photo is marked for removal', () => {
		cy.mount(<StatefulTripPhotos photos={PHOTOS} />)

		cy.get(TRIP_PHOTOS_SELECTORS.ALT_INPUT)
			.eq(1)
			.type('Harbour at dusk')
			.should('have.value', 'Harbour at dusk')
		cy.get(TRIP_PHOTOS_SELECTORS.ALT_INPUT)
			.eq(1)
			.should('have.attr', 'id')
			.then((id) =>
				cy
					.get(`label[for="${id}"]`)
					.should('contain.text', GLOBAL.PHOTO_ALT.LABEL_FOR(2)),
			)

		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).eq(1).click()
		cy.get(TRIP_PHOTOS_SELECTORS.ALT_INPUT).eq(1).should('be.disabled')
		cy.get(TRIP_PHOTOS_SELECTORS.UNDO).click()
		cy.get(TRIP_PHOTOS_SELECTORS.ALT_INPUT)
			.eq(1)
			.should('be.enabled')
			.and('have.value', 'Harbour at dusk')
	})

	it('removes and restores a photo, updating the count', () => {
		cy.mount(<StatefulTripPhotos photos={PHOTOS} />)

		cy.get(TRIP_PHOTOS_SELECTORS.COUNT).should(
			'have.text',
			TRIP_PHOTOS_CONFIG.COUNT(3),
		)

		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).eq(1).click()
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVED).should(
			'have.text',
			TRIP_PHOTOS_CONFIG.REMOVED_LABEL,
		)
		cy.get(TRIP_PHOTOS_SELECTORS.COUNT).should(
			'have.text',
			TRIP_PHOTOS_CONFIG.COUNT_AFTER_SAVE(2, 1, 0),
		)

		cy.get(TRIP_PHOTOS_SELECTORS.UNDO).click()
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVED).should('not.exist')
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).should('have.length', 3)
		cy.get(TRIP_PHOTOS_SELECTORS.COUNT).should(
			'have.text',
			TRIP_PHOTOS_CONFIG.COUNT(3),
		)
	})

	// Cypress's synthetic Enter does not activate a button, so the focused button is clicked instead
	it('moves keyboard focus to Undo on removal and back to Remove on undo', () => {
		cy.mount(<StatefulTripPhotos photos={PHOTOS} />)

		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).eq(1).focus().click()
		cy.focused()
			.should(
				'have.attr',
				'aria-label',
				TRIP_PHOTOS_CONFIG.UNDO_LABEL(2, 3),
			)
			.click()
		cy.focused().should(
			'have.attr',
			'aria-label',
			TRIP_PHOTOS_CONFIG.REMOVE_LABEL(2, 3),
		)
	})

	it('stops the last kept photo being removed until a new one is chosen', () => {
		cy.mount(<StatefulTripPhotos photos={PHOTOS.slice(0, 2)} />)

		cy.get(TRIP_PHOTOS_SELECTORS.LAST_PHOTO_HINT).should('not.exist')
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).first().click()
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).should('be.disabled')
		cy.get(TRIP_PHOTOS_SELECTORS.LAST_PHOTO_HINT).should(
			'have.text',
			TRIP_PHOTOS_CONFIG.LAST_PHOTO_HINT,
		)

		cy.mount(
			<StatefulTripPhotos
				photos={PHOTOS.slice(0, 1)}
				newCount={1}
			/>,
		)
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).should('be.enabled')
	})
})
