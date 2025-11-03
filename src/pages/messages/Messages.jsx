import messagesStyles from './messages.module.scss'

const Messages = () => {
	return (
		<main
			className={`mainContainer ${messagesStyles.messagesContainer}`}
			data-cy="main-container"
			data-cy-alt="messages-main-container">
			<h1>Messages page</h1>
		</main>
	)
}

export default Messages
