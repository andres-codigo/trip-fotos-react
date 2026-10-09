import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import messagesStyles from './messages.module.scss'

const Messages = () => {
	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={`mainContainer ${messagesStyles.messagesContainer}`}
			data-cy="main-container"
			data-cy-alt="messages-main-container">
			<title>{`Messages · ${GLOBAL.SITE_NAME}`}</title>
			<h1>Messages page</h1>
		</main>
	)
}

export default Messages
