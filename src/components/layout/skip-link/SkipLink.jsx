import { ACCESSIBILITY } from '@/constants/ui'

import skipLinkStyles from './SkipLink.module.scss'

function SkipLink() {
	return (
		<a
			href={`#${ACCESSIBILITY.MAIN_CONTENT_ID}`}
			className={skipLinkStyles.skipLink}
			data-cy="skip-link">
			Skip to main content
		</a>
	)
}

export default SkipLink
