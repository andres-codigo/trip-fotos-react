import { useState } from 'react'
import PropTypes from 'prop-types'

import TripPhotos from '@/components/forms/trip-photos/TripPhotos'

import { TRIP_PHOTOS_SELECTORS } from '@/constants/test'
import { TRIP_PHOTOS_CONFIG } from '@/constants/travellers'

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

	return (
		<TripPhotos
			photos={photos}
			removedUrls={removedUrls}
			newCount={newCount}
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

	it('has no axe violations at rest, with a removal, the last-photo hint and an error', () => {
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
				photos={PHOTOS}
				onRemove={cy.stub()}
				onUndo={cy.stub()}
				error={TRIP_PHOTOS_CONFIG.NONE_LEFT_ERROR}
			/>,
		)
		cy.get(TRIP_PHOTOS_SELECTORS.ERROR).should('be.visible')
		cy.checkA11y()

		cy.mount(
			<TripPhotos
				photos={[]}
				onRemove={cy.stub()}
				onUndo={cy.stub()}
			/>,
		)
		cy.get(TRIP_PHOTOS_SELECTORS.ROOT).should(
			'have.text',
			TRIP_PHOTOS_CONFIG.EMPTY_HINT,
		)
		cy.checkA11y()
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
