// Shared by Input, Textarea and Combobox so every text field looks and reports invalid alike; focus wins over invalid
export const fieldClasses =
	'block min-h-[2.375rem] w-full border border-muted p-[0.15rem] [font:inherit] focus:border-primary focus:bg-field-focus focus:outline-none aria-invalid:border-destructive aria-invalid:bg-field-invalid focus:aria-invalid:border-primary focus:aria-invalid:bg-field-focus'

export const labelClasses = 'mb-2 block font-semibold'

export const requiredMarkClasses = 'text-[#ff0000]'
