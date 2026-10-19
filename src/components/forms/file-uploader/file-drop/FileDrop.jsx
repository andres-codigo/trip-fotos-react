import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { FILE_DROP } from '@/constants/test'

import fileDropStyles from './FileDrop.module.scss'

const DRAG_EVENTS = ['dragenter', 'dragover', 'dragleave', 'drop']
// Dragging over a child fires dragleave on the parent; a short delay stops the active state flickering
const INACTIVE_DELAY_MS = 50

const preventDefaults = (event) => event.preventDefault()

const FileDrop = ({ onFilesDropped, className = '', children }) => {
	const [isActive, setIsActive] = useState(false)
	const inactiveTimeout = useRef(null)

	const setActive = useCallback((event) => {
		event.preventDefault()
		clearTimeout(inactiveTimeout.current)
		setIsActive(true)
	}, [])

	const setInactive = useCallback(() => {
		clearTimeout(inactiveTimeout.current)
		inactiveTimeout.current = setTimeout(
			() => setIsActive(false),
			INACTIVE_DELAY_MS,
		)
	}, [])

	const handleDragLeave = (event) => {
		event.preventDefault()
		setInactive()
	}

	const handleDrop = (event) => {
		event.preventDefault()
		setInactive()
		onFilesDropped([...(event.dataTransfer?.files ?? [])])
	}

	useEffect(() => {
		// Stops the browser opening a file dropped just outside the zone
		DRAG_EVENTS.forEach((name) =>
			document.body.addEventListener(name, preventDefaults),
		)
		return () => {
			DRAG_EVENTS.forEach((name) =>
				document.body.removeEventListener(name, preventDefaults),
			)
			clearTimeout(inactiveTimeout.current)
		}
	}, [])

	return (
		<div
			className={`${fileDropStyles.dropArea} ${isActive ? fileDropStyles.active : ''} ${className}`.trim()}
			data-active={isActive}
			onDragEnter={setActive}
			onDragOver={setActive}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			data-cy={FILE_DROP.ID}>
			{typeof children === 'function' ? children({ isActive }) : children}
		</div>
	)
}

FileDrop.propTypes = {
	onFilesDropped: PropTypes.func.isRequired,
	className: PropTypes.string,
	children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
}

export default FileDrop
