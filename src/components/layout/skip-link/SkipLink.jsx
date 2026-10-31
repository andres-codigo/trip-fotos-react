import { ACCESSIBILITY } from '@/constants/ui'

// Kept off-screen rather than display: none so it stays in the tab order
function SkipLink() {
	return (
		<a
			href={`#${ACCESSIBILITY.MAIN_CONTENT_ID}`}
			className="absolute top-[-100vh] left-4 z-[2] bg-background px-4 py-3 font-bold text-primary focus:top-4 focus:outline-3 focus:outline-offset-2 focus:outline-accent"
			data-cy="skip-link">
			Skip to main content
		</a>
	)
}

export default SkipLink
