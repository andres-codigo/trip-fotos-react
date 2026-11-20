// Fetch responses for slice tests that mock global fetch
export const okJson = (data) => ({ ok: true, json: async () => data })

export const failing = (status = 500) => ({ ok: false, status })
