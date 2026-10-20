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
	it('chooses an option with the keyboard', () => {
		const onSelect = cy.stub().as('onSelect')
		cy.mount(<Harness onSelect={onSelect} />)

		cy.get(COMBOBOX_SELECTORS.INPUT).type('to{downArrow}{downArrow}{enter}')

		cy.get('@onSelect').should('have.been.calledWith', OPTIONS[1])
		cy.get(COMBOBOX_SELECTORS.INPUT).should('have.value', '')
		cy.get(COMBOBOX_SELECTORS.LISTBOX).should('not.exist')
	})

	it('chooses an option with the mouse and highlights on hover', () => {
		const onSelect = cy.stub().as('onSelect')
		cy.mount(<Harness onSelect={onSelect} />)

		cy.get(COMBOBOX_SELECTORS.INPUT).type('to')
		cy.get(COMBOBOX_SELECTORS.STATUS).should('have.text', '2 cities found.')
		cy.get(COMBOBOX_SELECTORS.OPTION).first().click()

		cy.get('@onSelect').should('have.been.calledWith', OPTIONS[0])
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
