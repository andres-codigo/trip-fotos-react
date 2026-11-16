import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { API_DATABASE } from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'

import { signOut } from 'firebase/auth'

import { databaseRequest } from './databaseRequest'

vi.mock('firebase/auth', () => ({ signOut: vi.fn(() => Promise.resolve()) }))

vi.mock('@/services/firebase/firebase', () => ({
	getFirebaseAuth: () => 'mock-auth',
}))

const BASE = API_DATABASE.BASE_URL

describe('databaseRequest', () => {
	beforeEach(() => {
		global.fetch = vi.fn().mockResolvedValue({ ok: true })
		vi.mocked(signOut).mockClear()
	})

	it('GETs the path with a .json suffix and the JSON headers by default', async () => {
		await databaseRequest('/travellers')

		expect(fetch).toHaveBeenCalledWith(`${BASE}/travellers.json`, {
			method: API_DATABASE.GET,
			headers: { 'Content-Type': 'application/json' },
		})
	})

	it('adds the auth token as a query parameter', async () => {
		await databaseRequest('/messages/u1', { token: 'abc' })

		expect(fetch.mock.calls[0][0]).toBe(`${BASE}/messages/u1.json?auth=abc`)
	})

	it('combines extra query parameters with the token', async () => {
		await databaseRequest('/travellers/u1', {
			token: 'abc',
			params: { shallow: true },
		})

		expect(fetch.mock.calls[0][0]).toBe(
			`${BASE}/travellers/u1.json?auth=abc&shallow=true`,
		)
	})

	it('sends the method and a JSON-encoded body', async () => {
		await databaseRequest('/messages/u1', {
			method: API_DATABASE.POST,
			body: { message: 'hi' },
		})

		const [, options] = fetch.mock.calls[0]
		expect(options.method).toBe(API_DATABASE.POST)
		expect(options.body).toBe(JSON.stringify({ message: 'hi' }))
	})

	it('sends no body when none is given', async () => {
		await databaseRequest('/messages/u1', { method: API_DATABASE.DELETE })

		expect(fetch.mock.calls[0][1]).not.toHaveProperty('body')
	})

	it('returns the response when it is ok', async () => {
		const response = { ok: true, json: vi.fn() }
		fetch.mockResolvedValueOnce(response)

		await expect(databaseRequest('/travellers')).resolves.toBe(response)
	})

	it('throws REQUEST_ERROR when the response is not ok', async () => {
		fetch.mockResolvedValueOnce({ ok: false, status: 500 })

		await expect(databaseRequest('/travellers')).rejects.toThrow(
			ERROR_MESSAGES.REQUEST_ERROR,
		)
	})

	describe('database namespace', () => {
		afterEach(() => {
			vi.unstubAllEnvs()
			vi.resetModules()
		})

		it('adds no ns parameter when no namespace is configured', async () => {
			await databaseRequest('/travellers', { token: 'abc' })

			expect(fetch.mock.calls[0][0]).not.toContain('ns=')
		})

		it('adds the configured namespace for the emulators', async () => {
			vi.stubEnv('VITE_DATABASE_NAMESPACE', 'demo-default-rtdb')
			vi.resetModules()
			const { databaseRequest: request } =
				await import('./databaseRequest')

			await request('/travellers', { token: 'abc' })

			expect(fetch.mock.calls[0][0]).toContain(
				'?ns=demo-default-rtdb&auth=abc',
			)
		})
	})

	it('lets a network failure through unchanged', async () => {
		const failure = new TypeError('Failed to fetch')
		fetch.mockRejectedValueOnce(failure)

		await expect(databaseRequest('/travellers')).rejects.toBe(failure)
	})

	describe('a refused token', () => {
		const refused = (error) => ({
			ok: false,
			status: 401,
			json: async () => ({ error }),
		})

		it('ends the session when the database cannot accept the token', async () => {
			fetch.mockResolvedValueOnce(refused('Auth token is expired'))

			await expect(
				databaseRequest('/travellers', { token: 'abc' }),
			).rejects.toThrow(ERROR_MESSAGES.REQUEST_ERROR)
			expect(signOut).toHaveBeenCalledWith('mock-auth')
		})

		it('keeps the session when a rule refuses the request', async () => {
			fetch.mockResolvedValueOnce(refused(API_DATABASE.PERMISSION_DENIED))

			await expect(
				databaseRequest('/travellers', { token: 'abc' }),
			).rejects.toThrow(ERROR_MESSAGES.REQUEST_ERROR)
			expect(signOut).not.toHaveBeenCalled()
		})

		it('keeps the session when no token was sent', async () => {
			fetch.mockResolvedValueOnce(refused('Unauthorized request.'))

			await expect(databaseRequest('/travellers')).rejects.toThrow(
				ERROR_MESSAGES.REQUEST_ERROR,
			)
			expect(signOut).not.toHaveBeenCalled()
		})

		it('still reports the request error when signing out fails', async () => {
			fetch.mockResolvedValueOnce(refused('Auth token is expired'))
			signOut.mockRejectedValueOnce(new Error('offline'))

			await expect(
				databaseRequest('/travellers', { token: 'abc' }),
			).rejects.toThrow(ERROR_MESSAGES.REQUEST_ERROR)
		})
	})
})
