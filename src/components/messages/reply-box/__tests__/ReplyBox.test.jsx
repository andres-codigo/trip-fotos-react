import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MESSAGES_CONFIG } from '@/constants/travellers'

import ReplyBox from '@/components/messages/reply-box/ReplyBox'

const LABEL = MESSAGES_CONFIG.REPLY_LABEL('Ana Lopes')

const setPointer = (isFine) => {
	window.matchMedia = vi.fn(() => ({ matches: isFine }))
}

const renderBox = (props = {}) => {
	const onSend = vi.fn()
	render(
		<ReplyBox
			label={LABEL}
			onSend={onSend}
			{...props}
		/>,
	)
	return {
		onSend,
		input: screen.getByRole('textbox', { name: LABEL }),
		send: screen.getByRole('button', { name: MESSAGES_CONFIG.SEND }),
	}
}

describe('<ReplyBox />', () => {
	afterEach(() => {
		delete window.matchMedia
	})

	it('labels the textarea and limits its length', () => {
		const { input } = renderBox()

		expect(input).toHaveAttribute(
			'placeholder',
			MESSAGES_CONFIG.REPLY_PLACEHOLDER,
		)
		expect(input).toHaveAttribute(
			'maxlength',
			String(MESSAGES_CONFIG.MAX_LENGTH),
		)
		expect(input).toHaveAttribute('rows', '1')
	})

	it('hands the textarea to inputRef', () => {
		const inputRef = createRef()
		const { input } = renderBox({ inputRef })

		expect(inputRef.current).toBe(input)
	})

	it('keeps Send focusable but inert while the text is blank', () => {
		const { input, send, onSend } = renderBox()

		expect(send).toHaveAttribute('aria-disabled', 'true')
		expect(send).not.toBeDisabled()
		fireEvent.change(input, { target: { value: '   ' } })
		fireEvent.click(send)

		expect(send).toHaveAttribute('aria-disabled', 'true')
		expect(onSend).not.toHaveBeenCalled()
	})

	it('sends the trimmed text and clears the box', () => {
		const { input, send, onSend } = renderBox()

		fireEvent.change(input, { target: { value: '  See you there  ' } })
		expect(send).not.toHaveAttribute('aria-disabled')
		fireEvent.click(send)

		expect(onSend).toHaveBeenCalledExactlyOnceWith('See you there')
		expect(input).toHaveValue('')
	})

	it('sends on Enter with a fine pointer, and Shift+Enter does not', () => {
		setPointer(true)
		const { input, onSend } = renderBox()
		fireEvent.change(input, { target: { value: 'Hi' } })

		fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
		expect(onSend).not.toHaveBeenCalled()

		fireEvent.keyDown(input, { key: 'Enter' })
		expect(onSend).toHaveBeenCalledExactlyOnceWith('Hi')
	})

	it('does not send on Enter with a coarse pointer', () => {
		setPointer(false)
		const { input, onSend } = renderBox()
		fireEvent.change(input, { target: { value: 'Hi' } })

		fireEvent.keyDown(input, { key: 'Enter' })
		expect(onSend).not.toHaveBeenCalled()
		expect(input).toHaveValue('Hi')
	})
})
