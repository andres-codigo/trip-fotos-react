// Every error dialog is a BaseDialog with isError, which is the only alertdialog
export const ERROR_DIALOG = '[role="alertdialog"]'

export const atPath = (path) => (win) => win.location.pathname === path

export const shows = (selector) => (win) =>
	Boolean(win.document.querySelector(selector))

// The error dialog wins over success, so a save that failed never waits out the timeout
export const successOutcome = (win, success) => {
	const dialog = win.document.querySelector(ERROR_DIALOG)
	if (dialog) return { error: dialog.textContent.trim() }
	return success(win) ? { done: true } : null
}
