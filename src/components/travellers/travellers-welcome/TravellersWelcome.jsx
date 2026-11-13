import { useId } from 'react'
import { Link } from 'react-router-dom'

import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { API_DATABASE } from '@/constants/api'
import { AUTH_FORM_CONFIG } from '@/constants/auth'
import { PATHS } from '@/constants/ui'
import { TRAVELLERS_WELCOME_CONFIG } from '@/constants/travellers'

import BaseButton from '@/components/ui/button/BaseButton'

// The Authentication page reads this param and opens on its sign-up form
const SIGNUP_PATH = `${PATHS.AUTHENTICATION}?${AUTH_FORM_CONFIG.MODE_PARAM}=${API_DATABASE.AUTH_SIGNUP_MODE}`

const TravellersWelcome = ({ className }) => {
	const headingId = useId()

	return (
		// A labelled region rather than <section>: the unlayered page-shell section rule would override the flex layout and padding.
		// Stacked below 1024px; from there the copy sits on the left and the actions on the right, Create an account above the Log in line, so reading and tab order are unchanged
		<div
			role="region"
			aria-labelledby={headingId}
			className={cn(
				'mb-4 flex flex-col gap-4 rounded-lg border border-accent-text bg-surface-accent p-4.5 lg:flex-row lg:items-center lg:justify-between lg:gap-8',
				className,
			)}
			data-cy="travellers-welcome">
			<div className="flex flex-col gap-1 lg:max-w-[60ch]">
				<h2
					id={headingId}
					className="m-0 text-lg font-bold">
					{TRAVELLERS_WELCOME_CONFIG.TITLE}
				</h2>
				<p className="m-0">{TRAVELLERS_WELCOME_CONFIG.TEXT}</p>
			</div>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-none lg:flex-col lg:items-end lg:gap-2">
				<BaseButton
					isLink
					to={SIGNUP_PATH}
					modeType="primary"
					data-cy="travellers-welcome-create-account">
					{TRAVELLERS_WELCOME_CONFIG.CREATE_ACCOUNT}
				</BaseButton>
				<p className="m-0">
					{TRAVELLERS_WELCOME_CONFIG.LOG_IN_PROMPT}{' '}
					<Link
						to={PATHS.AUTHENTICATION}
						className="font-medium text-text-link underline underline-offset-4"
						data-cy="travellers-welcome-log-in">
						{TRAVELLERS_WELCOME_CONFIG.LOG_IN}
					</Link>
				</p>
			</div>
		</div>
	)
}

TravellersWelcome.propTypes = {
	className: PropTypes.string,
}

export default TravellersWelcome
