import { cn } from '@/utils/cn'
import useViewport from '@/utils/useViewport'
import { MESSAGES_PAGE_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT } from '@/constants/ui'

import ConversationSkeleton from '@/components/messages/conversation-skeleton/ConversationSkeleton'

const CARD = 'rounded-lg border border-border-card shadow-card'

// The route fallback while the page's code downloads: the page's own loading state, so it takes over with nothing moving
const MessagesPageSkeleton = () => {
	const { width } = useViewport()
	const isWide = width >= GLOBAL.BREAKPOINT.TABLET

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-left"
			data-cy={MESSAGES_PAGE_SKELETON.ROOT}>
			<title>{`${MESSAGES_CONFIG.TITLE} · ${GLOBAL.SITE_NAME}`}</title>
			<div className={PAGE_LAYOUT.WIDE}>
				<h1 className="mt-0 mb-1 text-title font-bold lg:text-display">
					{MESSAGES_CONFIG.TITLE}
				</h1>
				<p
					role="status"
					className="mt-1 mb-3 text-sm text-text-muted lg:mb-4">
					{GLOBAL.SPINNER_LABEL.MESSAGES}
				</p>
				<div className={PAGE_LAYOUT.COLUMNS}>
					<div className={cn(CARD, 'overflow-hidden bg-surface')}>
						<ConversationSkeleton
							variant="list"
							count={
								isWide
									? MESSAGES_CONFIG.DESKTOP_LIST_SKELETON_COUNT
									: MESSAGES_CONFIG.LIST_SKELETON_COUNT
							}
						/>
					</div>
					{isWide && (
						<div
							className={cn(
								CARD,
								'flex h-[calc(100dvh-15rem)] min-h-[28rem] flex-col overflow-hidden bg-bg',
							)}>
							<ConversationSkeleton variant="header" />
							<div className="mt-auto p-3">
								<ConversationSkeleton variant="thread" />
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	)
}

export default MessagesPageSkeleton
