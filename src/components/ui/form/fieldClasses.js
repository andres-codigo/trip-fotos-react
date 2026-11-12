// Shared by Input, Textarea and Combobox so every text field looks and reports invalid alike; the global focus ring shows over either
export const fieldClasses =
	'block min-h-[2.375rem] w-full border border-border-strong bg-surface p-[0.15rem] text-text [font:inherit] aria-invalid:border-2 aria-invalid:border-danger-text aria-invalid:bg-danger-surface'

export const labelClasses = 'mb-2 block font-semibold'

export const requiredMarkClasses = 'text-danger-text'

export const helpTextClasses = '-mt-1 mb-2 text-sm text-text-muted'

// Helper text is read before the error, so the rule comes before what broke it
export const describedBy = (id, helpText, hasError) =>
	[helpText && `${id}-help`, hasError && `${id}-error`]
		.filter(Boolean)
		.join(' ') || undefined
