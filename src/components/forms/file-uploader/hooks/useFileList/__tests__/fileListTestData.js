import { FILE_UPLOAD } from '@/constants/validation'

export const createFile = ({
	name = 'photo.jpg',
	type = 'image/jpeg',
	size = 1024,
	lastModified = 1700000000000,
} = {}) => {
	const file = new File(['x'], name, { type, lastModified })
	Object.defineProperty(file, 'size', { value: size })
	return file
}

export const OVERSIZED_BYTES = FILE_UPLOAD.MAX_SIZE_MEGABYTES * 1024 * 1024 + 1
