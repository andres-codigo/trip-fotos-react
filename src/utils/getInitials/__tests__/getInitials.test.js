import { describe, it, expect } from 'vitest'

import { getInitials } from '@/utils/getInitials'

describe('getInitials', () => {
	it.each([
		['Amara Okafor', 'AO'],
		['Amara O.', 'AO'],
		['Jonas van der Weber', 'JW'],
		['Cher', 'C'],
		['  Amara   Okafor  ', 'AO'],
		['amara okafor', 'AO'],
	])('turns %j into %j', (name, initials) => {
		expect(getInitials(name)).toBe(initials)
	})

	it.each(['', '  '])(
		'returns an empty string for the blank name %j',
		(name) => {
			expect(getInitials(name)).toBe('')
		},
	)
})
