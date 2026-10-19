export const createFile = ({
	name = 'photo.png',
	type = 'image/png',
	lastModified = 1700000000000,
} = {}) => new File(['x'], name, { type, lastModified })
