import { CITY_SEARCH } from '@/constants/api'
import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import BaseCard from '@/components/ui/card/BaseCard'

const Privacy = () => {
	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage mx-auto max-w-3xl"
			data-cy="main-container"
			data-cy-alt="privacy-main-container">
			<title>{`Privacy policy · ${GLOBAL.SITE_NAME}`}</title>
			<BaseCard>
				<h1 className="my-[0.83em] text-[1.5rem]">Privacy policy</h1>
				<p>
					Trip Fotos is a learning project. This page explains what
					data the app collects, why, and where it is stored.
				</p>

				<h2 className="mt-6 mb-[1em] text-[1.17rem]">Account data</h2>
				<p>
					When you sign up or log in, your email address and password
					are sent to Firebase Authentication (Google) to create and
					verify your account. Your password is never stored by Trip
					Fotos itself.
				</p>

				<h2 className="mt-6 mb-[1em] text-[1.17rem]">
					Traveller registration
				</h2>
				<p>
					If you register as a traveller, the name, trip description,
					travel days, cities and photos you provide are stored in
					Firebase Realtime Database and Cloud Storage, and are shown
					to other signed-in users.
				</p>

				<h2 className="mt-6 mb-[1em] text-[1.17rem]">City search</h2>
				<p>
					When you search for a city during registration, the text you
					type is sent to{' '}
					<a
						href={CITY_SEARCH.PROVIDER_URL}
						target="_blank"
						rel="noopener noreferrer">
						Photon
					</a>
					, a place search service run by Komoot, to suggest matching
					cities. It is not linked to your account. City data is ©{' '}
					<a
						href={CITY_SEARCH.ATTRIBUTION_URL}
						target="_blank"
						rel="noopener noreferrer">
						OpenStreetMap contributors
					</a>
					, available under the Open Database Licence.
				</p>

				<h2 className="mt-6 mb-[1em] text-[1.17rem]">
					Data stored in your browser
				</h2>
				<p>
					The app keeps your sign-in session and loaded traveller data
					in your browser&apos;s local storage so you stay signed in
					between visits. Logging out clears your session. No
					advertising or tracking cookies are set.
				</p>

				<h2 className="mt-6 mb-[1em] text-[1.17rem]">Analytics</h2>
				<p>
					Vercel Web Analytics and Speed Insights record anonymous,
					aggregated page views and performance measurements. They do
					not use cookies or identify individual visitors.
				</p>

				<h2 className="mt-6 mb-[1em] text-[1.17rem]">Your choices</h2>
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
