import { CONVERSATION_AVATAR_SELECTORS } from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import ConversationAvatar from '@/components/messages/conversation-avatar/ConversationAvatar'

const mountAvatar = (props) =>
	cy.mount(
		<main className="flex gap-3 p-4">
			<ConversationAvatar
				name="Ana Lopes"
				status={SENDER_STATUS.TRAVELLER}
				{...props}
			/>
		</main>,
	)

const sizeOf = ($root) => $root[0].firstElementChild.getBoundingClientRect()

describe('<ConversationAvatar />', () => {
	it('is a 40px circle by default and 32px when small', () => {
		mountAvatar()
		cy.get(CONVERSATION_AVATAR_SELECTORS.ROOT).then(($root) => {
			expect(sizeOf($root).width).to.equal(40)
			expect(sizeOf($root).height).to.equal(40)
		})

		mountAvatar({ size: 'sm' })
		cy.get(CONVERSATION_AVATAR_SELECTORS.ROOT).then(($root) => {
			expect(sizeOf($root).width).to.equal(32)
		})
	})

	it('draws a former traveller on a sunken ground with a card border, at 40px', () => {
		mountAvatar({ status: SENDER_STATUS.FORMER })

		cy.get(CONVERSATION_AVATAR_SELECTORS.ROOT).then(($root) => {
			const circle = $root[0].firstElementChild
			const style = getComputedStyle(circle)
			expect(style.backgroundColor).to.equal('rgb(20, 19, 15)')
			expect(style.borderTopWidth).to.equal('1px')
			expect(style.color).to.equal('rgb(181, 175, 159)')
			expect(sizeOf($root).width).to.equal(40)
		})
		cy.checkA11y()
	})
})
