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
			.and('have.css', 'border-color', 'rgb(23, 88, 127)')
			.trigger('dragleave')
			.should('have.attr', 'data-active', 'false')
	})

	it('emits dropped files', () => {
		const onFilesDropped = cy.stub().as('onFilesDropped')
		cy.mount(<FileDrop onFilesDropped={onFilesDropped} />)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP).selectFile(
			{ contents: Cypress.Buffer.from('x'), fileName: 'a.png' },
			{ action: 'drag-drop' },
		)

		cy.get('@onFilesDropped').should('have.been.calledOnce')
	})
})
