import { FILE_UPLOADER_SELECTORS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import FilePreview from '@/components/forms/file-uploader/file-preview/FilePreview'

import {
	IMAGE_FILE,
	NON_IMAGE_FILE,
} from '@/components/forms/file-uploader/file-preview/__tests__/filePreviewTestData'

describe('<FilePreview />', () => {
	it('shows the name and a thumbnail for an image', () => {
		cy.mount(
			<ul>
				<FilePreview
					file={IMAGE_FILE}
					onRemove={cy.stub()}
				/>
			</ul>,
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_NAME).should(
			'have.text',
			IMAGE_FILE.name,
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_THUMBNAIL).should(
			'have.attr',
			'src',
			IMAGE_FILE.url,
		)
	})

	it('has no thumbnail for a non-image file', () => {
		cy.mount(
			<FilePreview
				file={NON_IMAGE_FILE}
				onRemove={cy.stub()}
				tag="div"
			/>,
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_THUMBNAIL).should(
			'not.exist',
		)
	})

	it('removes via the labelled, focusable button', () => {
		const onRemove = cy.stub().as('onRemove')
		cy.mount(
			<FilePreview
				file={IMAGE_FILE}
				onRemove={onRemove}
				tag="div"
			/>,
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_REMOVE)
			.should(
				'have.attr',
				'aria-label',
				GLOBAL.REMOVE_FILE_LABEL(IMAGE_FILE.name),
			)
			.focus()
			.should('have.focus')
			.click()
		cy.get('@onRemove').should('have.been.calledWith', IMAGE_FILE)
	})

	it('shows the error status with white text', () => {
		cy.mount(
			<FilePreview
				file={{ ...IMAGE_FILE, status: GLOBAL.FILE_STATUS.ERROR }}
				onRemove={cy.stub()}
				tag="div"
			/>,
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_STATUS)
			.should('have.text', GLOBAL.FILE_STATUS_LABEL.error)
			.and('have.css', 'color', 'rgb(255, 255, 255)')
	})
})
