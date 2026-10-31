import { Link } from 'react-router-dom'

import { PATHS } from '@/constants/ui'

function Footer() {
	return (
		<footer
			className="flex justify-center border-x-0 border-t border-b-0 border-solid border-border px-5 py-6"
			data-cy="site-footer">
			<Link
				to={PATHS.PRIVACY}
				className="inline-block p-3 text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
				data-cy="footer-privacy-link">
				Privacy policy
			</Link>
		</footer>
	)
}

export default Footer
