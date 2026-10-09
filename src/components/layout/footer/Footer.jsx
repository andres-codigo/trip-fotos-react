import { Link } from 'react-router-dom'

import { PATHS } from '@/constants/ui'

import footerStyles from './Footer.module.scss'

function Footer() {
	return (
		<footer
			className={footerStyles.siteFooter}
			data-cy="site-footer">
			<Link
				to={PATHS.PRIVACY}
				className={footerStyles.siteFooterLink}
				data-cy="footer-privacy-link">
				Privacy policy
			</Link>
		</footer>
	)
}

export default Footer
