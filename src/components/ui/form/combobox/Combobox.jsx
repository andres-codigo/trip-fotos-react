import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { COMBOBOX } from '@/constants/test'

import comboboxStyles from './Combobox.module.scss'

const Combobox = ({
	id,
	label,
	value,
	onChange,
	options,
	onSelect,
	onBlur,
	statusMessage = '',
	placeholder,
	isValid = true,
	describedBy,
	disabled = false,
	required = false,
	footer,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [activeIndex, setActiveIndex] = useState(-1)
	const listboxRef = useRef(null)

	const listboxId = `${id}-listbox`
	const statusId = `${id}-status`
	const optionId = (index) => `${id}-option-${index}`
	const showListbox = isOpen && options.length > 0

	useEffect(() => {
		if (activeIndex < 0) return
		listboxRef.current
			?.querySelector('[aria-selected="true"]')
			?.scrollIntoView?.({ block: 'nearest' })
	}, [activeIndex])

	const selectOption = (option) => {
		onSelect(option)
		onChange('')
		setIsOpen(false)
		setActiveIndex(-1)
	}

	const handleChange = (event) => {
		onChange(event.target.value)
		setIsOpen(true)
		setActiveIndex(-1)
	}

	const handleKeyDown = (event) => {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault()
				setIsOpen(true)
				setActiveIndex((index) =>
					options.length ? (index + 1) % options.length : -1,
				)
				break
			case 'ArrowUp':
				event.preventDefault()
				setIsOpen(true)
				setActiveIndex((index) =>
					options.length
						? (index - 1 + options.length) % options.length
						: -1,
				)
				break
			case 'Enter':
				// Typed text alone is never added, and Enter must not submit the surrounding form mid-search
				if (value.trim() || showListbox) event.preventDefault()
				if (showListbox && activeIndex >= 0) {
					selectOption(options[activeIndex])
				}
				break
			case 'Escape':
				if (showListbox) {
					setIsOpen(false)
					setActiveIndex(-1)
				} else if (value) {
					onChange('')
				}
				break
			default:
				break
		}
	}

	return (
		<div className={comboboxStyles.combobox}>
			<label htmlFor={id}>
				{label + ' '}
				{required && (
					<span
						className={comboboxStyles.required}
						aria-hidden="true">
						*
					</span>
				)}
			</label>
			<input
				id={id}
				type="text"
				role="combobox"
				autoComplete="off"
				aria-autocomplete="list"
				aria-expanded={showListbox}
				aria-controls={listboxId}
				aria-activedescendant={
					showListbox && activeIndex >= 0
						? optionId(activeIndex)
						: undefined
				}
				aria-invalid={!isValid}
				aria-required={required}
				aria-describedby={
					[statusId, describedBy].filter(Boolean).join(' ') ||
					undefined
				}
				placeholder={placeholder}
				value={value}
				disabled={disabled}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onFocus={() => setIsOpen(true)}
				onBlur={(event) => {
					setIsOpen(false)
					onBlur?.(event)
				}}
				data-cy={COMBOBOX.INPUT}
			/>
			{showListbox && (
				<ul
					id={listboxId}
					ref={listboxRef}
					role="listbox"
					aria-label={label}
					className={comboboxStyles.listbox}
					data-cy={COMBOBOX.LISTBOX}>
					{options.map((option, index) => (
						<li
							key={option.id}
							id={optionId(index)}
							role="option"
							aria-selected={index === activeIndex}
							className={`${comboboxStyles.option} ${index === activeIndex ? comboboxStyles.active : ''}`}
							// Keeps focus in the input so blur does not close the list before the click lands
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => selectOption(option)}
							data-cy={COMBOBOX.OPTION}>
							{option.label}
						</li>
					))}
				</ul>
			)}
			<p
				id={statusId}
				role="status"
				aria-live="polite"
				className={comboboxStyles.status}
				data-cy={COMBOBOX.STATUS}>
				{statusMessage}
			</p>
			{footer}
		</div>
	)
}

Combobox.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	options: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
		}),
	).isRequired,
	onSelect: PropTypes.func.isRequired,
	onBlur: PropTypes.func,
	statusMessage: PropTypes.string,
	placeholder: PropTypes.string,
	isValid: PropTypes.bool,
	describedBy: PropTypes.string,
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	footer: PropTypes.node,
}

export default Combobox
