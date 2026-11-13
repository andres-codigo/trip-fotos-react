// Below 1024px a page stacks in the 640px card column; from 1024px a page with two kinds of content widens to the Travellers grid's 1160px, with a 380px left column. Class names are written out whole, as Tailwind only finds literal ones
export const PAGE_LAYOUT = Object.freeze({
	NARROW: 'mx-auto w-full max-w-160',
	WIDE: 'mx-auto w-full max-w-160 lg:max-w-290',
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
})
