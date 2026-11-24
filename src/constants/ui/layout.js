// Below 1024px a page stacks in the 640px card column; from 1024px a page with two kinds of content widens to the Travellers grid's 1160px, with a 380px left column. Class names are written out whole, as Tailwind only finds literal ones
export const PAGE_LAYOUT = Object.freeze({
	NARROW: 'mx-auto w-full max-w-160',
	WIDE: 'mx-auto w-full max-w-160 lg:max-w-290',
	// The Travellers grid's width at every size
	GRID: 'mx-auto w-full max-w-290',
	COLUMNS:
		'flex flex-col lg:grid lg:grid-cols-[23.75rem_minmax(0,1fr)] lg:items-start lg:gap-6',
	// A lone card under the columns that lines up with the left one
	LEFT_COLUMN: 'lg:mx-0 lg:max-w-[23.75rem]',
	// A BaseCard's auto margins would shrink it to its content in a flex or grid column, and its 640px cap would leave the column part empty
	COLUMN_CARD: 'w-full lg:max-w-none',
	// One card below 1024px that opens up from 1024px into its sections, each then a card of its own
	PAGE_CARD:
		'rounded-lg border border-border-card bg-surface p-4 shadow-card lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none',
	SECTION_CARD:
		'lg:rounded-lg lg:border lg:border-border-card lg:bg-surface lg:p-4 lg:shadow-card',
	// A hash target lands the page-title gap under the 80px header, as .cardPage spaces the title
	ANCHOR_SCROLL_MARGIN: 'scroll-mt-28 mobile:scroll-mt-26',
})

// The photo strip at the foot of a Travellers card, shared by the cards and their skeleton so the two cannot drift. Class names are written out whole, as Tailwind only finds literal ones
export const CARD_PHOTOS = Object.freeze({
	// Three tiles across; two from 480px down, where three would be too small to make out
	TILE_WIDTH: 'w-[32%] [@media(max-width:480px)]:w-[48%]',
	LIST: 'm-0 flex list-none flex-wrap gap-x-[2%] gap-y-2 pt-0 pb-4 pl-0 [@media(max-width:480px)]:gap-x-[4%] [@media(max-width:480px)]:gap-y-4',
	// Three across at every width: two per row on phones would leave the third photo alone
	PUBLIC_LIST:
		'm-0 flex list-none gap-x-[2%] pt-0 pb-4 pl-0 [@media(max-width:480px)]:[&>li]:w-[32%]',
})

// One column on phones, two from 640px and three from 1024px, the maximum. Each card is a subgrid of five rows, so its parts line up with its neighbours'; a row gap would also open between those rows, so the cards' bottom margin spaces the grid rows and the list's negative one takes the last away
export const TRAVELLERS_GRID =
	'mx-0 mt-0 -mb-4 grid list-none grid-cols-1 gap-x-4 gap-y-0 p-0 sm:grid-cols-2 lg:grid-cols-3'

// The Messages lists, shared by the page and its skeleton
