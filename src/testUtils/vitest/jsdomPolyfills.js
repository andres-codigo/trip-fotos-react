// jsdom doesn't implement window.AnimationEvent, which makes React's
// vendor-prefix detection mis-resolve "animationend" to "webkitanimationend".
// All real browsers have supported the unprefixed AnimationEvent for years.
// This must run before react-dom is imported anywhere, so it lives in its
// own setup file loaded ahead of testingLibrarySetup.js.
if (typeof window.AnimationEvent === 'undefined') {
	window.AnimationEvent = window.Event
}
