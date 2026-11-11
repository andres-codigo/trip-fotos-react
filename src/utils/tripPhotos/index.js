// The database turns a sparse array into an object, so each list is read by index either way
export const toTripPhotos = ({ files, fileDimensions, fileThumbnails } = {}) =>
	Object.values(files ?? {}).map((url, index) => ({
		url,
		dimensions: fileDimensions?.[index] ?? null,
		thumbnails: fileThumbnails?.[index] ?? null,
	}))

export const thumbnailUrlsOf = (thumbnails) =>
	Object.values(thumbnails ?? {}).map(({ url }) => url)
