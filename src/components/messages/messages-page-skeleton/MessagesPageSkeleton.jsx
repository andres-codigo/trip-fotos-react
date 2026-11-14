import { cn } from '@/utils/cn'
import useViewport from '@/utils/useViewport'
import { MESSAGES_PAGE_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT } from '@/constants/ui'

import MessagesSkeleton from '@/components/messages/messages-skeleton/MessagesSkeleton'

import BaseCard from '@/components/ui/card/BaseCard'

// The route fallback while the page's code downloads: the page's own loading state, so it takes over with nothing moving
const MessagesPageSkeleton = () => {
	const { width } = useViewport()
	const isInbox = width >= GLOBAL.BREAKPOINT.TABLET

	const heading = <h1 className="mt-0 mb-1">{MESSAGES_CONFIG.TITLE}</h1>
	const status = (
		<p
			role="status"
			className={cn(
				'mt-1 text-sm text-text-muted',
				isInbox ? 'mb-4' : 'mb-3.5',
			)}>
			{GLOBAL.SPINNER_LABEL.MESSAGES}
		</p>
	)

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-left"
			data-cy={MESSAGES_PAGE_SKELETON.ROOT}>
			<title>{`${MESSAGES_CONFIG.TITLE} · ${GLOBAL.SITE_NAME}`}</title>
			{isInbox ? (
				<div className={PAGE_LAYOUT.WIDE}>
					{heading}
					{status}
					<div className={PAGE_LAYOUT.COLUMNS}>
						<MessagesSkeleton isInbox />
					</div>
				</div>
			) : (
				<section>
					<BaseCard>
						{heading}
						{status}
						<MessagesSkeleton />
					</BaseCard>
				</section>
			)}
		</main>
	)
}

export default MessagesPageSkeleton
