import { useSelector } from 'react-redux'

import { TRAVELLERS_PAGE_SKELETON } from '@/constants/test'
import { TRAVELLERS_LIST_CONFIG } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import { selectIsAuthenticated } from '@/store/slices/authenticationSlice'

import TravellersSkeleton from '@/components/travellers/travellers-skeleton/TravellersSkeleton'
import TravellersWelcome from '@/components/travellers/travellers-welcome/TravellersWelcome'

// The route fallback while the page's code downloads: the page as it first renders, so the page's own loading state takes over with nothing moving
const TravellersPageSkeleton = () => {
	const isLoggedIn = useSelector(selectIsAuthenticated)

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-left"
			data-cy={TRAVELLERS_PAGE_SKELETON.ROOT}>
			<title>{`${TRAVELLERS_LIST_CONFIG.TITLE} · ${GLOBAL.SITE_NAME}`}</title>
			<div className="mx-auto w-full max-w-290">
				{!isLoggedIn && <TravellersWelcome />}
				<div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
					<h1 className="my-0 grow">
						{TRAVELLERS_LIST_CONFIG.TITLE}
					</h1>
					{/* Keeps the heading row as tall as the page's, where the Refresh button sits */}
					<span className="ml-auto size-11" />
				</div>
				<TravellersSkeleton isPublic={!isLoggedIn} />
			</div>
		</main>
	)
}

export default TravellersPageSkeleton
