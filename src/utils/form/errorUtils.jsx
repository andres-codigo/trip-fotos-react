export const renderVisuallyHiddenError = (fieldState, id, className) => {
	if (!fieldState || fieldState.isValid || !fieldState.message) return null

	return (
		<span
			id={id}
			role="alert"
			className={className}>
			{fieldState.message}
		</span>
	)
}
