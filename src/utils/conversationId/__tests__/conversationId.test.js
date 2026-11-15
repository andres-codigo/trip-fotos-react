import { describe, it, expect } from 'vitest'

import { conversationId, otherMemberId, pushId } from '@/utils/conversationId'

describe('conversationId', () => {
	it('gives both members the same id, sorted', () => {
		expect(conversationId('b-uid', 'a-uid')).toBe('a-uid_b-uid')
		expect(conversationId('a-uid', 'b-uid')).toBe('a-uid_b-uid')
	})
})

describe('otherMemberId', () => {
	it.each([
		['a-uid_b-uid', 'a-uid', 'b-uid'],
		['a-uid_b-uid', 'b-uid', 'a-uid'],
	])('in %j, the other member of %j is %j', (cid, uid, other) => {
		expect(otherMemberId(cid, uid)).toBe(other)
	})

	it('returns null when the id has no other member', () => {
		expect(otherMemberId('a-uid', 'a-uid')).toBeNull()
	})
})

describe('pushId', () => {
	it('is 20 characters from the Firebase push id alphabet', () => {
		expect(pushId()).toMatch(/^[-0-9A-Za-z_]{20}$/)
	})

	it('sorts by time', () => {
		expect(pushId(1000) < pushId(2000)).toBe(true)
	})

	it('differs for the same time', () => {
		expect(pushId(1000)).not.toBe(pushId(1000))
	})
})
