import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import BaseCard from '@/components/ui/card/BaseCard'

import privacyStyles from './privacy.module.scss'

const Privacy = () => {
	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={['mainContainer', privacyStyles.privacyContainer].join(
				' ',
			)}
			data-cy="main-container"
			data-cy-alt="privacy-main-container">
			<title>{`Privacy policy · ${GLOBAL.SITE_NAME}`}</title>
			<BaseCard>
				<h1>Privacy policy</h1>
				<p>
					Trip Fotos is a learning project. This page explains what
					data the app collects, why, and where it is stored.
				</p>

				<h2>Account data</h2>
				<p>
					When you sign up or log in, your email address and password
					are sent to Firebase Authentication (Google) to create and
					verify your account. Your password is never stored by Trip
					Fotos itself.
				</p>

				<h2>Traveller registration</h2>
				<p>
					If you register as a traveller, the name, description,
					travel days, cities and photos you provide are stored in
					Firebase Realtime Database and Cloud Storage, and are shown
					to other signed-in users.
				</p>

				<h2>Data stored in your browser</h2>
				<p>
					The app keeps your sign-in session and loaded traveller data
					in your browser&apos;s local storage so you stay signed in
					between visits. Logging out clears your session. No
					advertising or tracking cookies are set.
				</p>

				<h2>Analytics</h2>
				<p>
					Vercel Web Analytics and Speed Insights record anonymous,
					aggregated page views and performance measurements. They do
					not use cookies or identify individual visitors.
				</p>

				<h2>Your choices</h2>
				<p>
					To have your account or traveller profile removed, or to ask
					what data is held about you, email{' '}
					<a href="mailto:phones-medleys8x@icloud.com">
						phones-medleys8x@icloud.com
					</a>{' '}
					from the address you signed up with.
				</p>
			</BaseCard>
		</main>
	)
}

export default Privacy
