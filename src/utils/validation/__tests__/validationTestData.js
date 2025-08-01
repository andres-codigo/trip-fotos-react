export const VALID_EMAILS = Object.freeze([
	'test@example.com',
	'user.name@domain.com.au',
	'user_name@example.org',
	'user-name@example.net',
	'simple@test.io',
	'complex.email+tag@subdomain.example.com',
])

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

export const VALID_PASSWORDS = Object.freeze([
	'123456',
	'password',
	'verylongpassword',
	'P@ssw0rd123',
])

export const PASSWORD_CHARACTER_DIFFERENCE = Object.freeze([
	{ password: '', expectedDiff: 6 },
	{ password: '123', expectedDiff: 3 },
	{ password: '12345', expectedDiff: 1 },
])
