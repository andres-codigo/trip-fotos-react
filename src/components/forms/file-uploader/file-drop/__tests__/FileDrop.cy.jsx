import { FILE_UPLOADER_SELECTORS } from '@/constants/test'

import FileDrop from '@/components/forms/file-uploader/file-drop/FileDrop'

describe('<FileDrop />', () => {
	it('draws the accent border while a file is dragged over', () => {
		cy.mount(
			<FileDrop onFilesDropped={cy.stub()}>
				<span>Drop here</span>
			</FileDrop>,
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP)
			.trigger('dragenter')
			.should('have.css', 'border-color', 'rgb(169, 201, 138)')
	})

	it('has no axe violations', () => {
		cy.mount(
			<FileDrop onFilesDropped={cy.stub()}>
				<label htmlFor="drop-input">
					Drop here
					<input
						id="drop-input"
						type="file"
					/>
				</label>
			</FileDrop>,
		)
		cy.checkA11y()
	})
})
