import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import { PATHS } from '@/constants/ui'

import { cn } from '@/utils/cn'

function Footer({ className }) {
	return (
		<footer
			className={cn(
				'flex justify-center border-x-0 border-t border-b-0 border-solid border-border px-5 py-6',
				className,
			)}
			data-cy="site-footer">
			<Link
				to={PATHS.PRIVACY}
				className="inline-block p-3 text-accent-text underline underline-offset-4"
				data-cy="footer-privacy-link">
				Privacy policy
			</Link>
		</footer>
	)
}

Footer.propTypes = {
	className: PropTypes.string,
}

export default Footer
