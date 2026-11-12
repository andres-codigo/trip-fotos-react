import { FILE_UPLOADER_SELECTORS } from '@/constants/test'

import FilePreview from '@/components/forms/file-uploader/file-preview/FilePreview'

import {
	IMAGE_FILE,
	NON_IMAGE_FILE,
} from '@/components/forms/file-uploader/file-preview/__tests__/filePreviewTestData'

describe('<FilePreview />', () => {
	it('has no axe violations for an image and a non-image file', () => {
		cy.mount(
			<ul>
				<FilePreview
					file={IMAGE_FILE}
					onRemove={cy.stub()}
				/>
				<FilePreview
					file={NON_IMAGE_FILE}
					onRemove={cy.stub()}
				/>
			</ul>,
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('have.length', 2)
		cy.checkA11y()
	})
})
