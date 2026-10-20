import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import { COMBOBOX } from '@/constants/test'

import Combobox from '@/components/ui/form/combobox/Combobox'

const OPTIONS = [
	{ id: 'a', label: 'Sydney, New South Wales, Australia' },
	{ id: 'b', label: 'Sydney, Nova Scotia, Canada' },
]

const Harness = ({ onSelect = vi.fn(), options = OPTIONS, ...props }) => {
	const [value, setValue] = useState('')
	return (
		<form onSubmit={props.onSubmit ?? ((e) => e.preventDefault())}>
			<Combobox
				id="city"
				label="Search for a city"
				value={value}
				onChange={setValue}
				options={options}
				onSelect={onSelect}
				{...props}
			/>
		</form>
	)
}

const getInput = () =>
	screen.getByRole('combobox', { name: 'Search for a city' })

describe('<Combobox />', () => {
	it('renders a labelled combobox, collapsed until typing', () => {
		render(<Harness />)
		const input = getInput()
		expect(input).toHaveAttribute('aria-expanded', 'false')
		expect(input).toHaveAttribute('aria-autocomplete', 'list')
		expect(screen.queryByRole('listbox')).toBeNull()
	})

	it('opens the listbox when typing and links it to the input', () => {
		render(<Harness />)
		fireEvent.change(getInput(), { target: { value: 'syd' } })

		const listbox = screen.getByRole('listbox')
		expect(getInput()).toHaveAttribute('aria-expanded', 'true')
		expect(getInput()).toHaveAttribute('aria-controls', listbox.id)
		expect(screen.getAllByRole('option')).toHaveLength(2)
	})

	it('stays collapsed with no options', () => {
		render(<Harness options={[]} />)
		fireEvent.change(getInput(), { target: { value: 'syd' } })
		expect(getInput()).toHaveAttribute('aria-expanded', 'false')
	})

	it('moves the active option with arrow keys and wraps', () => {
		render(<Harness />)
		const input = getInput()
		fireEvent.change(input, { target: { value: 'syd' } })

		fireEvent.keyDown(input, { key: 'ArrowDown' })
		const [first, second] = screen.getAllByRole('option')
		expect(input).toHaveAttribute('aria-activedescendant', first.id)
		expect(first).toHaveAttribute('aria-selected', 'true')

		fireEvent.keyDown(input, { key: 'ArrowDown' })
		expect(input).toHaveAttribute('aria-activedescendant', second.id)

		fireEvent.keyDown(input, { key: 'ArrowDown' })
		expect(input).toHaveAttribute('aria-activedescendant', first.id)

		fireEvent.keyDown(input, { key: 'ArrowUp' })
		expect(input).toHaveAttribute('aria-activedescendant', second.id)
	})

	it('selects the active option with Enter, clears and closes', () => {
		const onSelect = vi.fn()
		render(<Harness onSelect={onSelect} />)
		const input = getInput()
		fireEvent.change(input, { target: { value: 'syd' } })
		fireEvent.keyDown(input, { key: 'ArrowDown' })
		fireEvent.keyDown(input, { key: 'Enter' })

		expect(onSelect).toHaveBeenCalledWith(OPTIONS[0])
		expect(input).toHaveValue('')
		expect(screen.queryByRole('listbox')).toBeNull()
	})

	it('selects an option on click', () => {
		const onSelect = vi.fn()
		render(<Harness onSelect={onSelect} />)
		fireEvent.change(getInput(), { target: { value: 'syd' } })
		fireEvent.click(screen.getAllByRole('option')[1])

		expect(onSelect).toHaveBeenCalledWith(OPTIONS[1])
	})

	it('never adds typed text on Enter and does not submit the form', () => {
		const onSelect = vi.fn()
		const onSubmit = vi.fn((e) => e.preventDefault())
		render(
			<Harness
				onSelect={onSelect}
				onSubmit={onSubmit}
			/>,
		)
		const input = getInput()
		fireEvent.change(input, { target: { value: 'syd' } })
		const event = fireEvent.keyDown(input, { key: 'Enter' })

		expect(event).toBe(false)
		expect(onSelect).not.toHaveBeenCalled()
		expect(input).toHaveValue('syd')
	})

	it('closes with Escape, then clears on a second Escape', () => {
		render(<Harness />)
		const input = getInput()
		fireEvent.change(input, { target: { value: 'syd' } })

		fireEvent.keyDown(input, { key: 'Escape' })
		expect(screen.queryByRole('listbox')).toBeNull()
		expect(input).toHaveValue('syd')

		fireEvent.keyDown(input, { key: 'Escape' })
		expect(input).toHaveValue('')
	})

	it('closes on blur', () => {
		render(<Harness />)
		const input = getInput()
		fireEvent.change(input, { target: { value: 'syd' } })
		fireEvent.blur(input)
		expect(screen.queryByRole('listbox')).toBeNull()
	})

	it('announces the status message and links it and errors to the input', () => {
		render(
			<Harness
				statusMessage="2 cities found."
				describedBy="cities-error"
				isValid={false}
				required
			/>,
		)
		const status = screen.getByTestId(COMBOBOX.STATUS)
		expect(status).toHaveAttribute('role', 'status')
		expect(status).toHaveTextContent('2 cities found.')

		const input = getInput()
		expect(input.getAttribute('aria-describedby')).toBe(
			`${status.id} cities-error`,
		)
		expect(input).toHaveAttribute('aria-invalid', 'true')
		expect(input).toHaveAttribute('aria-required', 'true')
	})

	it('marks a required field visually and focuses the input from its label', () => {
		render(<Harness required />)
		const label = screen.getByText('Search for a city', { exact: false })
		expect(label.tagName).toBe('LABEL')
		expect(label.querySelector('[aria-hidden="true"]')).toHaveTextContent(
			'*',
		)

		fireEvent.click(label)
		expect(label.htmlFor).toBe(getInput().id)
	})
})
