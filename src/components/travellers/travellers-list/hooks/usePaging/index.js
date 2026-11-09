import { useCallback, useMemo, useState } from 'react'

const usePaging = (items = [], { pageSize, resetKey } = {}) => {
	const list = useMemo(() => (Array.isArray(items) ? items : []), [items])
	const [state, setState] = useState({
		key: resetKey,
		count: pageSize,
		firstNewIndex: null,
	})

	let current = state
	if (!Object.is(state.key, resetKey)) {
		current = { key: resetKey, count: pageSize, firstNewIndex: null }
		setState(current)
	}

	const total = list.length
	const visibleCount = Math.min(current.count, total)
	const nextCount = Math.min(pageSize, total - visibleCount)
	const hasMore = visibleCount < total

	const showMore = useCallback(() => {
		setState((previous) => {
			const shown = Math.min(previous.count, total)
			if (shown >= total) return previous
			return {
				...previous,
				count: shown + pageSize,
				firstNewIndex: shown,
			}
		})
	}, [pageSize, total])

	const visibleItems = useMemo(
		() => list.slice(0, visibleCount),
		[list, visibleCount],
	)

	return {
		visibleItems,
		visibleCount,
		total,
		nextCount,
		hasMore,
		showMore,
		firstNewIndex: current.firstNewIndex,
	}
}

export default usePaging
