const PUSH_CHARS =
	'-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

// Sorted, so both members derive the same id; the rules rely on uids never containing "_"
export const conversationId = (uid, otherUid) =>
	[uid, otherUid].sort().join('_')

export const otherMemberId = (cid, uid) =>
	cid.split('_').find((member) => member !== uid) ?? null

// Same shape as a Firebase push id (8 time characters, 12 random), so ids sort by send time
export const pushId = (now = Date.now()) => {
	let time = now
	let timeChars = ''
	for (let i = 0; i < 8; i++) {
		timeChars = PUSH_CHARS.charAt(time % 64) + timeChars
		time = Math.floor(time / 64)
	}
	const random = crypto.getRandomValues(new Uint8Array(12))
	return timeChars + Array.from(random, (n) => PUSH_CHARS[n % 64]).join('')
}
