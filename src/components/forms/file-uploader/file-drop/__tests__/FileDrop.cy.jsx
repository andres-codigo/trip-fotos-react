import { FILE_UPLOADER_SELECTORS } from '@/constants/test'

import FileDrop from '@/components/forms/file-uploader/file-drop/FileDrop'

describe('<FileDrop />', () => {
	it('changes styling on drag over and back after leaving', () => {
		cy.mount(
			<FileDrop onFilesDropped={cy.stub()}>
				<span>Drop here</span>
			</FileDrop>,
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP)
			.should('have.attr', 'data-active', 'false')
			.trigger('dragenter')
			.should('have.attr', 'data-active', 'true')
			.and('have.css', 'border-color', 'rgb(169, 201, 138)')
			.trigger('dragleave')
			.should('have.attr', 'data-active', 'false')
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
