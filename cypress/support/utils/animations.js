// Finite ones only: a spinner's infinite animation never finishes. A cancelled one counts as settled
export const animationsSettled = (doc) =>
	Promise.all(
		doc
			.getAnimations()
			.filter(
				(animation) =>
					animation.effect?.getComputedTiming().iterations !==
					Infinity,
			)
			.map((animation) => animation.finished.catch(() => null)),
	)
