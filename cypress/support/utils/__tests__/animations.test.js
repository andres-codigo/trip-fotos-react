import { animationsSettled } from '../animations'

const animation = ({ iterations = 1, finished = Promise.resolve() } = {}) => ({
	effect: { getComputedTiming: () => ({ iterations }) },
	finished,
})

const deferred = () => {
	let resolve
	const promise = new Promise((done) => (resolve = done))
	return { promise, resolve }
}

describe('animationsSettled', () => {
	it('waits for a fade-in still running', async () => {
		const fade = deferred()
		let settled = false
		animationsSettled({
			getAnimations: () => [animation({ finished: fade.promise })],
		}).then(() => (settled = true))
		await Promise.resolve()
		expect(settled).toBe(false)
		fade.resolve()
		await fade.promise
		await new Promise((resolve) => setTimeout(resolve))
		expect(settled).toBe(true)
	})

	it('ignores an infinite animation, such as a spinner', async () => {
		const never = new Promise(() => {})
		await expect(
			animationsSettled({
				getAnimations: () => [
					animation({ iterations: Infinity, finished: never }),
				],
			}),
		).resolves.toEqual([])
	})

	it('treats a cancelled animation as settled', async () => {
		const cancelled = Promise.reject(new Error('AbortError'))
		await expect(
			animationsSettled({
				getAnimations: () => [animation({ finished: cancelled })],
			}),
		).resolves.toEqual([null])
	})
})
