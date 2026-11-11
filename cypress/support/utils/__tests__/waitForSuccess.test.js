import { atPath, shows, successOutcome } from '../waitForSuccess'

const page = (html, pathname = '/') => {
	document.body.innerHTML = html
	return { document, location: { pathname } }
}

describe('successOutcome', () => {
	it('reports the error dialog even when success also holds', () => {
		const win = page(
			'<div role="alertdialog"> Something went wrong </div>',
			'/travellers',
		)

		expect(successOutcome(win, atPath('/travellers'))).toEqual({
			error: 'Something went wrong',
		})
	})

	it('is done when success holds and no error dialog shows', () => {
		const win = page('<div role="dialog">Saving</div>', '/travellers')

		expect(successOutcome(win, atPath('/travellers'))).toEqual({
			done: true,
		})
	})

	it('keeps waiting while neither shows', () => {
		expect(successOutcome(page('', '/edit'), atPath('/travellers'))).toBe(
			null,
		)
	})

	it('reads success from a selector', () => {
		expect(
			successOutcome(
				page('<p data-cy="saved"></p>'),
				shows('[data-cy="saved"]'),
			),
		).toEqual({ done: true })
		expect(successOutcome(page(''), shows('[data-cy="saved"]'))).toBe(null)
	})
})
