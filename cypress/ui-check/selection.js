export const DEFAULT_WIDTHS = [390, 1280]

// UI_CHECK_ONLY: comma-separated parts of capture ids or titles, case-insensitive; empty runs every capture
export const parseOnly = (only) =>
	String(only ?? '')
		.split(',')
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean)

const matches = (part, id, title) =>
	`${id} ${title}`.toLowerCase().includes(part)

export const runsCapture = (parts, id, title = '') =>
	!parts.length || parts.some((part) => matches(part, id, title))

const toWidths = (list) =>
	String(list)
		.split(',')
		.map((width) => Number(width.trim()))
		.filter(Boolean)

// UI_CHECK_WIDTHS: the widths for every capture, then `;part=widths` for the captures that part names, so 768 or a breakpoint runs only where the change touches it. `390,1280;edit=390,768,1280`
export const parseWidthSpec = (spec) => {
	const [base, ...overrides] = String(spec ?? '').split(';')
	const widths = toWidths(base)
	return {
		base: widths.length ? widths : DEFAULT_WIDTHS,
		overrides: overrides
			.map((override) => override.split('='))
			.filter(([part, list]) => part?.trim() && list)
			.map(([part, list]) => [part.trim().toLowerCase(), toWidths(list)]),
	}
}

export const widthsFor = (spec, id, title = '') =>
	spec.overrides.find(([part]) => matches(part, id, title))?.[1] ?? spec.base

// cy.visit to a URL that differs only in its hash keeps the page, so the app never reloads
export const onlyHashDiffers = (current, target) => {
	if (!/^https?:/.test(current)) return false
	const from = new URL(current)
	const to = new URL(target, current)
	return (
		from.origin + from.pathname + from.search ===
		to.origin + to.pathname + to.search
	)
}
