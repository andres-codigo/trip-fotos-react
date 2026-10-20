import { useCallback, useEffect, useRef, useState } from 'react'

import { FILE_UPLOAD, VALIDATION_MESSAGES } from '@/constants/validation'

const MAX_SIZE_BYTES = FILE_UPLOAD.MAX_SIZE_MEGABYTES * 1024 * 1024

const getFileId = (file) =>
	`${file.name}-${file.size}-${file.lastModified}-${file.type}`

const validateFile = (file) => {
	if (!FILE_UPLOAD.ACCEPTED_TYPES.includes(file.type)) {
		return VALIDATION_MESSAGES.FILE_TYPE_INVALID(file.name)
	}
	if (file.size > MAX_SIZE_BYTES) {
		return VALIDATION_MESSAGES.FILE_TOO_LARGE(
			file.name,
			FILE_UPLOAD.MAX_SIZE_MEGABYTES,
		)
	}
	return null
}

const useFileList = () => {
	const [files, setFiles] = useState([])
	const [errors, setErrors] = useState([])

	// Ref keeps actions stable and keeps object-URL side effects out of state updaters
	const filesRef = useRef(files)

	useEffect(() => {
		filesRef.current = files
	}, [files])

	useEffect(
		() => () => {
			filesRef.current.forEach(({ url }) => URL.revokeObjectURL(url))
		},
		[],
	)

	const addFiles = useCallback((newFiles) => {
		const nextErrors = []
		const seen = new Set(filesRef.current.map(({ id }) => id))
		const additions = []

		;[...(newFiles ?? [])].forEach((file) => {
			const error = validateFile(file)
			if (error) {
				nextErrors.push(error)
				return
			}
			const id = getFileId(file)
			if (seen.has(id)) return
			seen.add(id)
			additions.push({
				id,
				file,
				name: file.name,
				size: file.size,
				type: file.type,
				url: URL.createObjectURL(file),
			})
		})

		setErrors(nextErrors)
		if (additions.length) {
			const next = [...filesRef.current, ...additions]
			filesRef.current = next
			setFiles(next)
		}
	}, [])

	const removeFile = useCallback((fileToRemove) => {
		const target = filesRef.current.find(({ id }) => id === fileToRemove.id)
		if (!target) return
		URL.revokeObjectURL(target.url)
		const next = filesRef.current.filter(({ id }) => id !== target.id)
		filesRef.current = next
		setFiles(next)
	}, [])

	const clearFiles = useCallback(() => {
		filesRef.current.forEach(({ url }) => URL.revokeObjectURL(url))
		filesRef.current = []
		setFiles([])
		setErrors([])
	}, [])

	return { files, errors, addFiles, removeFile, clearFiles }
}

export default useFileList
