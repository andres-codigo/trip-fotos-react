export const VALID_EMAILS = [
	'test@example.com',
	'user.name@domain.com.au',
	'user_name@example.org',
	'user-name@example.net',
	'simple@test.io',
	'complex.email+tag@subdomain.example.com',
]

export const INVALID_EMAILS = Object.freeze([
	'invalid-email',
	'@example.com',
	'user@',
	'user@.com',
	'user..name@example.com',
	'user@domain',
	'user name@example.com', // spaces
	'user@domain..com', // double dots in domain
])
