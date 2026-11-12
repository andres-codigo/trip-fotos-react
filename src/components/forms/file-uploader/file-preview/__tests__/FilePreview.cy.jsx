import { FILE_UPLOADER_SELECTORS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import FilePreview from '@/components/forms/file-uploader/file-preview/FilePreview'

import {
	IMAGE_FILE,
	NON_IMAGE_FILE,
} from '@/components/forms/file-uploader/file-preview/__tests__/filePreviewTestData'

const box = ($el) => $el[0].getBoundingClientRect()

const mountRow = (file, width) =>
	cy.mount(
		<ul
			className="m-0 list-none p-0"
			style={{ width }}>
			<FilePreview
				file={file}
				onRemove={cy.stub()}
				onAltChange={cy.stub()}
				showAltHelp
			/>
		</ul>,
	)

describe('<FilePreview />', () => {
	// The uploader is about 300px wide on a 390px phone and 560px from tablet up
	;[300, 560].forEach((width) => {
		it(`lays out thumbnail, name and Remove on one line with the alt field below in a ${width}px list`, () => {
			mountRow(
				{
					...IMAGE_FILE,
					name: `${'a-very-long-photo-name-'.repeat(4)}.jpg`,
					size: 2.4 * 1024 * 1024,
				},
				width,
			)

			cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).then(($row) => {
				const row = box($row)
				cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW_THUMBNAIL).then(
					($thumb) => {
						const thumb = box($thumb)
						expect(thumb.width).to.equal(64)
						expect(thumb.height).to.equal(64)

						cy.get(
							FILE_UPLOADER_SELECTORS.FILE_PREVIEW_REMOVE,
						).then(($remove) => {
							const remove = box($remove)
							// 44px target, on the thumbnail's line, against the row's right edge
							expect(remove.width).to.equal(44)
							expect(remove.height).to.equal(44)
							expect(remove.top).to.equal(thumb.top)
							expect(row.right - remove.right).to.be.lessThan(12)

							cy.get(
								FILE_UPLOADER_SELECTORS.FILE_PREVIEW_NAME,
							).then(($name) => {
								const name = box($name)
								expect(name.left).to.be.greaterThan(thumb.right)
								expect(name.right).to.be.at.most(remove.left)
								expect($name[0].scrollWidth).to.be.greaterThan(
									$name[0].clientWidth,
								)
							})

							cy.get(
								FILE_UPLOADER_SELECTORS.FILE_PREVIEW_ALT_INPUT,
							).then(($alt) => {
								const alt = box($alt)
								expect(alt.top).to.be.greaterThan(thumb.bottom)
								expect(alt.left).to.be.at.least(row.left)
								expect(alt.right).to.be.at.most(row.right)
							})
						})
					},
				)
			})
			cy.contains('2.4 MB').should('be.visible')
		})
	})

	it('shows the alt help only when asked', () => {
		mountRow(IMAGE_FILE, 560)
		cy.contains(GLOBAL.PHOTO_ALT.HELP).should('be.visible')

		cy.mount(
			<ul>
				<FilePreview
					file={IMAGE_FILE}
					onRemove={cy.stub()}
					onAltChange={cy.stub()}
				/>
			</ul>,
		)
		cy.contains(GLOBAL.PHOTO_ALT.HELP).should('not.exist')
	})

	it('has no axe violations for an image and a non-image file', () => {
		cy.mount(
			<ul>
				<FilePreview
					file={IMAGE_FILE}
					onRemove={cy.stub()}
					onAltChange={cy.stub()}
					showAltHelp
				/>
				<FilePreview
					file={NON_IMAGE_FILE}
					onRemove={cy.stub()}
					onAltChange={cy.stub()}
				/>
			</ul>,
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('have.length', 2)
		cy.checkA11y()
	})
})
