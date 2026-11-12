import { FILE_UPLOADER_SELECTORS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

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

	it('shows a focus outline when the input is focused by keyboard', () => {
		cy.mount(<AddFile />)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).focus()
		cy.get('label').should('have.css', 'outline-style', 'solid')
	})

	it('stacks one full-width row per file', () => {
		cy.mount(<AddFile />)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			[pngFile('a.png'), pngFile('b.png')],
			{ force: true },
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).then(($rows) => {
			const [first, second] = [...$rows].map((row) =>
				row.getBoundingClientRect(),
			)
			expect(second.left).to.equal(first.left)
			expect(second.width).to.equal(first.width)
			expect(second.top).to.be.at.least(first.bottom)
		})
	})

	it('reports each file with the alt text typed for it', () => {
		const onFilesUpdated = cy.stub().as('onFilesUpdated')
		cy.mount(<AddFile onFilesUpdated={onFilesUpdated} />)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			pngFile('a.png'),
			{ force: true },
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_ALT_INPUT).type(
			'Old town square',
		)
		cy.get('@onFilesUpdated').should(
			'have.been.calledWithMatch',
			Cypress.sinon.match([
				Cypress.sinon.match({ name: 'a.png', alt: 'Old town square' }),
			]),
		)
	})

	// Cypress's synthetic Enter does not activate a button, so the focused button is clicked instead
	it("moves focus to the next row's Remove, then to the picker when none is left", () => {
		cy.mount(<AddFile />)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			[pngFile('a.png'), pngFile('b.png')],
			{ force: true },
		)

		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_REMOVE)
			.first()
			.focus()
			.click()
		cy.focused()
			.should(
				'have.attr',
				'aria-label',
				GLOBAL.REMOVE_FILE_LABEL('b.png'),
			)
			.click()
		cy.focused().should('match', FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT)
	})

	it('marks the drop zone and input invalid and links the outside error', () => {
		cy.mount(
			<>
				<AddFile
					isInvalid
					describedBy="photos-error"
				/>
				<p
					id="photos-error"
					className="text-danger-text">
					Add at least one photo
				</p>
			</>,
		)

		cy.get('#photos-error').then(($error) => {
			cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP)
				.should('have.css', 'border-top-width', '2px')
				.and('have.css', 'border-top-color', $error.css('color'))
		})
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT)
			.should('have.attr', 'aria-invalid', 'true')
			.and('have.attr', 'aria-describedby', 'photos-error')
		cy.checkA11y()
	})

	it('has no axe violations empty, with previews and with an error', () => {
		cy.mount(<AddFile />)
		cy.checkA11y()

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			pngFile('a.png'),
			{ force: true },
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('have.length', 1)
		cy.checkA11y()

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			{
				contents: Cypress.Buffer.from('x'),
				fileName: 'notes.pdf',
				mimeType: 'application/pdf',
			},
			{ force: true },
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_ERRORS).should('be.visible')
		cy.checkA11y()
	})
})
