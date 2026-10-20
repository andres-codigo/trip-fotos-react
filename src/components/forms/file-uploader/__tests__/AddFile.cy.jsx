import { FILE_UPLOADER_SELECTORS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import AddFile from '@/components/forms/file-uploader/AddFile'

const pngFile = (fileName) => ({
	contents: Cypress.Buffer.from('x'),
	fileName,
	mimeType: 'image/png',
	lastModified: 1700000000000,
})

describe('<AddFile />', () => {
	it('adds files from the picker and reports them to the parent', () => {
		const onFilesUpdated = cy.stub().as('onFilesUpdated')
		cy.mount(<AddFile onFilesUpdated={onFilesUpdated} />)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			[pngFile('a.png'), pngFile('b.png')],
			{ force: true },
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('have.length', 2)
		cy.get('@onFilesUpdated').should('have.been.called')
	})

	it('adds files by drag and drop', () => {
		cy.mount(<AddFile />)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP).selectFile(pngFile('a.png'), {
			action: 'drag-drop',
		})

		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_NAME).should(
			'have.text',
			'a.png',
		)
	})

	it('removes a file', () => {
		cy.mount(<AddFile />)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			pngFile('a.png'),
			{ force: true },
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_REMOVE)
			.should(
				'have.attr',
				'aria-label',
				GLOBAL.REMOVE_FILE_LABEL('a.png'),
			)
			.click()

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_LIST).should('not.exist')
	})

	it('shows an accessible error for an unsupported file', () => {
		cy.mount(<AddFile />)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			{
				contents: Cypress.Buffer.from('x'),
				fileName: 'notes.pdf',
				mimeType: 'application/pdf',
			},
			{ force: true },
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_ERRORS)
			.should('have.attr', 'role', 'alert')
			.and(
				'contain.text',
				VALIDATION_MESSAGES.FILE_TYPE_INVALID('notes.pdf'),
			)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).should(
			'have.attr',
			'aria-invalid',
			'true',
		)
	})

	it('shows a focus outline when the input is focused by keyboard', () => {
		cy.mount(<AddFile />)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).focus()
		cy.get('label').should('have.css', 'outline-style', 'solid')
	})
})
