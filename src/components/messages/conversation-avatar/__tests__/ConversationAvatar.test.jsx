import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CONVERSATION_AVATAR } from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import ConversationAvatar from '@/components/messages/conversation-avatar/ConversationAvatar'

const renderAvatar = (props) =>
	render(
		<ConversationAvatar
			name="Ana Lopes"
			status={SENDER_STATUS.TRAVELLER}
			{...props}
		/>,
	)

describe('<ConversationAvatar />', () => {
	it('shows a traveller’s initials and is hidden from assistive tech', () => {
		renderAvatar()

		const avatar = screen.getByTestId(CONVERSATION_AVATAR.ROOT)
		expect(avatar).toHaveAttribute('aria-hidden', 'true')
		expect(avatar).toHaveTextContent('AL')
	})

	it.each([
		[SENDER_STATUS.FORMER, '?'],
		[SENDER_STATUS.UNKNOWN, '?'],
		[SENDER_STATUS.LEGACY, '@'],
	])('shows a placeholder for a %s sender', (status, mark) => {
		renderAvatar({ status })

		expect(screen.getByTestId(CONVERSATION_AVATAR.ROOT)).toHaveTextContent(
			mark,
		)
	})

	it('merges a className onto the root', () => {
		renderAvatar({ className: 'self-start' })

		expect(screen.getByTestId(CONVERSATION_AVATAR.ROOT)).toHaveClass(
			'self-start',
		)
	})
})
