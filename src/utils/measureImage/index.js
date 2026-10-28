// A failed measurement is null so the upload still goes ahead and the photo just gets the placeholder ratio
export const measureImage = async (file) => {
	try {
		const bitmap = await createImageBitmap(file)
		const { width, height } = bitmap
		bitmap.close?.()
		return width > 0 && height > 0 ? { width, height } : null
	} catch {
		return null
	}
}
