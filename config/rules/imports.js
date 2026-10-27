export default {
	'no-restricted-imports': [
		'error',
		{
			patterns: [
				{
					regex: '^\\.\\./',
					message:
						"Use the '@/' alias instead of parent-relative imports.",
				},
				{
					// test/selectors and test/utilities are nested barrels in their own right
					regex: '^@/constants/(?!test/(selectors|utilities)$)[^/]+/.+',
					message:
						"Import constants from the subdirectory barrel, e.g. '@/constants/ui'.",
				},
			],
		},
	],
}
