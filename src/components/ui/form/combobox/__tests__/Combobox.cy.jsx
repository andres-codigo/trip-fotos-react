import { useState } from 'react'
import PropTypes from 'prop-types'

import { COMBOBOX_SELECTORS } from '@/constants/test'

import Combobox from '@/components/ui/form/combobox/Combobox'

const OPTIONS = [
	{ id: 'a', label: 'Tokyo, Japan' },
	{ id: 'b', label: 'Toronto, Ontario, Canada' },
]

const Harness = ({ onSelect }) => {
	const [value, setValue] = useState('')
	return (
		<Combobox
			id="city"
			label="Search for a city"
			value={value}
			onChange={setValue}
			options={value ? OPTIONS : []}
			onSelect={onSelect}
			statusMessage={value ? '2 cities found.' : ''}
		/>
	)
}

Harness.propTypes = {
	onSelect: PropTypes.func.isRequired,
}

describe('<Combobox />', () => {
	it('has no axe violations closed and with the listbox open', () => {
		cy.mount(<Harness onSelect={cy.stub()} />)
		cy.checkA11y()

		cy.get(COMBOBOX_SELECTORS.INPUT).type('to')
		cy.get(COMBOBOX_SELECTORS.LISTBOX).should('be.visible')
		cy.checkA11y()
	})

	it('shows the listbox above following content', () => {
		cy.mount(
			<div>
				<Harness onSelect={cy.stub()} />
				<p>Following content</p>
			</div>,
		)
		cy.get(COMBOBOX_SELECTORS.INPUT).type('to')
		cy.get(COMBOBOX_SELECTORS.LISTBOX)
			.should('be.visible')
			.and('have.css', 'position', 'absolute')
	})
})
